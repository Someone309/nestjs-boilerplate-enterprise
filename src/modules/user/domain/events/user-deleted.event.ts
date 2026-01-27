import { DomainEvent } from '@core/domain/base';

/**
 * User Deleted Event
 *
 * Raised when a user is deleted (soft or hard).
 *
 * Section 2.3: Domain Layer - DomainEvent is immutable, past tense named
 */
export class UserDeletedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly hardDelete = false,
  ) {
    super(userId, 'User');
  }

  getPayload(): Record<string, unknown> {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      hardDelete: this.hardDelete,
    };
  }
}
