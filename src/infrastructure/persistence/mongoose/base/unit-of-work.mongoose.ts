import { Injectable, Scope } from '@nestjs/common';
import type { Connection, ClientSession } from 'mongoose';
import type {
  IUnitOfWork,
  IsolationLevel,
  TransactionOptions,
} from '@core/domain/ports/repositories';
import type { DomainEvent } from '@core/domain/base';
import type { IEventBus } from '@core/domain/ports/services';

/**
 * Mongoose Unit of Work Implementation
 *
 * Manages transaction boundaries and domain event dispatch for MongoDB.
 * Uses MongoDB sessions for transaction support.
 *
 * Note: MongoDB transactions require a replica set or sharded cluster.
 * Standalone MongoDB instances do not support transactions.
 *
 * Section 8.5: Transaction Management
 */
@Injectable({ scope: Scope.REQUEST })
export class MongooseUnitOfWork implements IUnitOfWork {
  private session: ClientSession | null = null;
  private pendingEvents: DomainEvent[] = [];
  private transactionActive = false;

  constructor(
    private readonly connection: Connection,
    private readonly eventBus: IEventBus,
  ) {}

  async beginTransaction(options?: TransactionOptions): Promise<void> {
    if (this.transactionActive) {
      throw new Error('Transaction already active');
    }

    this.session = await this.connection.startSession();

    // Map isolation levels to MongoDB read concerns
    const readConcernLevel = options?.isolationLevel
      ? this.mapIsolationLevel(options.isolationLevel)
      : 'majority';

    this.session.startTransaction({
      readConcern: { level: readConcernLevel },
      writeConcern: { w: 'majority' },
    });

    this.transactionActive = true;
  }

  async commit(): Promise<void> {
    if (!this.session || !this.transactionActive) {
      throw new Error('No active transaction to commit');
    }

    try {
      await this.session.commitTransaction();

      // Dispatch domain events after successful commit
      if (this.pendingEvents.length > 0) {
        await this.eventBus.publishAll(this.pendingEvents);
        this.clearPendingEvents();
      }
    } finally {
      await this.releaseSession();
    }
  }

  async rollback(): Promise<void> {
    if (!this.session || !this.transactionActive) {
      throw new Error('No active transaction to rollback');
    }

    try {
      await this.session.abortTransaction();
      this.clearPendingEvents();
    } finally {
      await this.releaseSession();
    }
  }

  async executeInTransaction<T>(fn: () => Promise<T>, options?: TransactionOptions): Promise<T> {
    await this.beginTransaction(options);

    try {
      const result = await fn();
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  addDomainEvents(events: DomainEvent[]): void {
    this.pendingEvents.push(...events);
  }

  getPendingEvents(): DomainEvent[] {
    return [...this.pendingEvents];
  }

  clearPendingEvents(): void {
    this.pendingEvents = [];
  }

  isTransactionActive(): boolean {
    return this.transactionActive;
  }

  /**
   * Get the current session for repositories
   * Repositories should use this session for transactional operations
   */
  getSession(): ClientSession | null {
    return this.session;
  }

  /**
   * MongoDB doesn't support traditional savepoints.
   * However, we can track logical savepoints.
   */
  createSavepoint(_name: string): Promise<void> {
    return Promise.reject(
      new Error('MongoDB does not support savepoints. Consider restructuring your transaction.'),
    );
  }

  rollbackToSavepoint(_name: string): Promise<void> {
    return Promise.reject(
      new Error('MongoDB does not support savepoints. Consider restructuring your transaction.'),
    );
  }

  releaseSavepoint(_name: string): Promise<void> {
    return Promise.reject(
      new Error('MongoDB does not support savepoints. Consider restructuring your transaction.'),
    );
  }

  private async releaseSession(): Promise<void> {
    if (this.session) {
      await this.session.endSession();
      this.session = null;
      this.transactionActive = false;
    }
  }

  private mapIsolationLevel(
    level: IsolationLevel,
  ): 'local' | 'majority' | 'linearizable' | 'snapshot' {
    // MongoDB read concern levels
    const mapping: Record<IsolationLevel, 'local' | 'majority' | 'linearizable' | 'snapshot'> = {
      'READ COMMITTED': 'majority',
      'REPEATABLE READ': 'snapshot',
      SERIALIZABLE: 'linearizable',
    };
    return mapping[level] || 'majority';
  }
}
