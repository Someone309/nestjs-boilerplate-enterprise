import { Entity } from './entity.base';
import type { DomainEvent } from './domain-event.base';

/**
 * Base Aggregate Root Class
 *
 * Aggregate roots are the entry point to an aggregate.
 * They maintain consistency boundaries and collect domain events.
 *
 * Section 2.3: Domain Layer - AggregateRoot is entry point, controls access to children
 * Section 6.1: Command Flow - Aggregate raises events
 */
export abstract class AggregateRoot<TId = string> extends Entity<TId> {
  private _domainEvents: DomainEvent[] = [];
  private _version = 0;

  /**
   * Get current version (for optimistic locking)
   */
  get version(): number {
    return this._version;
  }

  /**
   * Set version (used when loading from persistence)
   */
  setVersion(version: number): void {
    this._version = version;
  }

  /**
   * Increment version on save
   */
  incrementVersion(): void {
    this._version++;
  }

  /**
   * Get all uncommitted domain events
   */
  get domainEvents(): readonly DomainEvent[] {
    return this._domainEvents;
  }

  /**
   * Add a domain event to be dispatched after persistence
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Clear all domain events after dispatch
   */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Check if there are uncommitted domain events
   */
  hasUncommittedEvents(): boolean {
    return this._domainEvents.length > 0;
  }
}
