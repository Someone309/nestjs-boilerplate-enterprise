import type { IUnitOfWork, TransactionOptions } from '@core/domain/ports/repositories';
import type { DomainEvent } from '@core/domain/base';

/**
 * Mock Unit of Work for Testing
 */
export class MockUnitOfWork implements IUnitOfWork {
  private _domainEvents: DomainEvent[] = [];
  private _isTransactionActive = false;

  beginTransaction = jest.fn().mockImplementation((_options?: TransactionOptions) => {
    this._isTransactionActive = true;
    return Promise.resolve();
  });

  commit = jest.fn().mockImplementation(() => {
    this._isTransactionActive = false;
    return Promise.resolve();
  });

  rollback = jest.fn().mockImplementation(() => {
    this._isTransactionActive = false;
    return Promise.resolve();
  });

  executeInTransaction = jest.fn().mockImplementation(async <T>(fn: () => Promise<T>) => {
    this._isTransactionActive = true;
    try {
      const result = await fn();
      this._isTransactionActive = false;
      return result;
    } catch (error) {
      this._isTransactionActive = false;
      throw error;
    }
  });

  addDomainEvents(events: DomainEvent[]): void {
    this._domainEvents.push(...events);
  }

  getPendingEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  clearPendingEvents(): void {
    this._domainEvents = [];
  }

  isTransactionActive(): boolean {
    return this._isTransactionActive;
  }

  reset(): void {
    this.beginTransaction.mockClear();
    this.commit.mockClear();
    this.rollback.mockClear();
    this.executeInTransaction.mockClear();
    this._domainEvents = [];
    this._isTransactionActive = false;
  }
}

/**
 * Create a mock unit of work instance
 */
export function createMockUnitOfWork(): MockUnitOfWork {
  return new MockUnitOfWork();
}
