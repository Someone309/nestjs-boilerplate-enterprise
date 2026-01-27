import { generateUUID } from '@shared/utils';

/**
 * Base Domain Event Class
 *
 * Domain events record something that happened in the domain.
 * They are immutable and named in past tense.
 *
 * Section 2.3: Domain Layer - DomainEvent is immutable, past tense named
 * Section 6.3: Event Flow - Events dispatched post-commit
 */
export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly aggregateType: string;

  constructor(aggregateId: string, aggregateType: string) {
    this.eventId = generateUUID();
    this.occurredAt = new Date();
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
  }

  /**
   * Get the event name (class name by default)
   */
  get eventName(): string {
    return this.constructor.name;
  }

  /**
   * Serialize event to JSON for persistence/messaging
   */
  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      occurredAt: this.occurredAt.toISOString(),
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      payload: this.getPayload(),
    };
  }

  /**
   * Get event-specific payload
   * Override in subclasses to include event data
   */
  protected abstract getPayload(): Record<string, unknown>;
}
