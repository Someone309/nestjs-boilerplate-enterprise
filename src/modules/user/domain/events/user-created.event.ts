import { DomainEvent } from '@core/domain/base';

/**
 * User Created Event
 *
 * Raised when a new user is created.
 *
 * Section 2.3: Domain Layer - DomainEvent is immutable, past tense named
 */
export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly tenantId: string,
  ) {
    super(userId, 'User');
  }

  getPayload(): Record<string, unknown> {
    return {
      userId: this.userId,
      email: this.email,
      tenantId: this.tenantId,
    };
  }
}
