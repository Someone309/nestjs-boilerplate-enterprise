import { DomainEvent } from '@core/domain/base';

/**
 * User Updated Event Payload
 */
export interface UserUpdatedPayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  status?: string;
  roleIds?: string[];
  roleAdded?: string;
  roleRemoved?: string;
  emailVerified?: boolean;
  passwordChanged?: boolean;
}

/**
 * User Updated Event
 *
 * Raised when user data is modified.
 *
 * Section 2.3: Domain Layer - DomainEvent is immutable, past tense named
 */
export class UserUpdatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly changes: UserUpdatedPayload,
  ) {
    super(userId, 'User');
  }

  getPayload(): Record<string, unknown> {
    return {
      userId: this.userId,
      changes: this.changes,
    };
  }
}
