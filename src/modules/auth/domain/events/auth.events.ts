import { DomainEvent } from '@core/domain/base';

/**
 * User Logged In Event
 *
 * Raised when a user successfully logs in.
 */
export class UserLoggedInEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {
    super(userId, 'User');
  }

  protected getPayload(): Record<string, unknown> {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
    };
  }
}

/**
 * User Logged Out Event
 *
 * Raised when a user logs out.
 */
export class UserLoggedOutEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly logoutAll = false,
  ) {
    super(userId, 'User');
  }

  protected getPayload(): Record<string, unknown> {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      logoutAll: this.logoutAll,
    };
  }
}

/**
 * User Password Changed Event
 *
 * Raised when a user changes their password.
 */
export class UserPasswordChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly sessionsRevoked: boolean,
  ) {
    super(userId, 'User');
  }

  protected getPayload(): Record<string, unknown> {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      sessionsRevoked: this.sessionsRevoked,
    };
  }
}

/**
 * Login Failed Event
 *
 * Raised when a login attempt fails.
 */
export class LoginFailedEvent extends DomainEvent {
  constructor(
    public readonly email: string,
    public readonly tenantId: string,
    public readonly reason: 'invalid_credentials' | 'account_locked' | 'account_inactive',
    public readonly ipAddress?: string,
  ) {
    super(email, 'Auth');
  }

  protected getPayload(): Record<string, unknown> {
    return {
      email: this.email,
      tenantId: this.tenantId,
      reason: this.reason,
      ipAddress: this.ipAddress,
    };
  }
}

/**
 * Account Locked Event
 *
 * Raised when a user account is locked due to too many failed attempts.
 */
export class AccountLockedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly tenantId: string,
    public readonly lockDurationMinutes: number,
  ) {
    super(userId, 'User');
  }

  protected getPayload(): Record<string, unknown> {
    return {
      userId: this.userId,
      email: this.email,
      tenantId: this.tenantId,
      lockDurationMinutes: this.lockDurationMinutes,
    };
  }
}

/**
 * Token Refresh Event
 *
 * Raised when tokens are refreshed.
 */
export class TokenRefreshedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly sessionId: string,
  ) {
    super(userId, 'User');
  }

  protected getPayload(): Record<string, unknown> {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      sessionId: this.sessionId,
    };
  }
}
