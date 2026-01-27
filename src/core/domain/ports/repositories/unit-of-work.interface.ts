import type { DomainEvent } from '../../base';

/**
 * Transaction Isolation Level
 */
export type IsolationLevel = 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';

/**
 * Transaction Options
 */
export interface TransactionOptions {
  isolationLevel?: IsolationLevel;
  timeout?: number;
}

/**
 * Unit of Work Interface
 *
 * Manages transaction boundaries and coordinates domain event dispatch.
 * Application layer owns the transaction; repositories participate.
 *
 * Section 8.5: Transaction Management
 * - Track changes
 * - Atomic commit
 * - Event collection
 * - Connection management
 */
export interface IUnitOfWork {
  /**
   * Start a new transaction
   * @param options Transaction options
   */
  beginTransaction(options?: TransactionOptions): Promise<void>;

  /**
   * Commit the current transaction
   * Dispatches collected domain events after successful commit
   */
  commit(): Promise<void>;

  /**
   * Rollback the current transaction
   */
  rollback(): Promise<void>;

  /**
   * Execute a function within a transaction
   * Automatically commits on success, rollbacks on error
   * @param fn Function to execute
   * @param options Transaction options
   */
  executeInTransaction<T>(fn: () => Promise<T>, options?: TransactionOptions): Promise<T>;

  /**
   * Add domain events to be dispatched after commit
   * @param events Domain events to dispatch
   */
  addDomainEvents(events: DomainEvent[]): void;

  /**
   * Get all pending domain events
   */
  getPendingEvents(): DomainEvent[];

  /**
   * Clear pending domain events
   */
  clearPendingEvents(): void;

  /**
   * Check if a transaction is currently active
   */
  isTransactionActive(): boolean;

  /**
   * Create a savepoint (for nested transactions in SQL)
   * @param name Savepoint name
   */
  createSavepoint?(name: string): Promise<void>;

  /**
   * Rollback to a savepoint
   * @param name Savepoint name
   */
  rollbackToSavepoint?(name: string): Promise<void>;

  /**
   * Release a savepoint
   * @param name Savepoint name
   */
  releaseSavepoint?(name: string): Promise<void>;
}

/**
 * Unit of Work Factory Interface
 * Used to create new UoW instances per request
 */
export interface IUnitOfWorkFactory {
  /**
   * Create a new Unit of Work instance
   */
  create(): IUnitOfWork;
}

/**
 * Unit of Work Token for dependency injection
 */
export const UNIT_OF_WORK = Symbol('UNIT_OF_WORK');
