import { DomainEvent } from '@core/domain/base';

/**
 * Tenant Activated Event
 *
 * Raised when a tenant is activated.
 */
export class TenantActivatedEvent extends DomainEvent {
  constructor(public readonly tenantId: string) {
    super(tenantId, 'Tenant');
  }

  protected getPayload(): Record<string, unknown> {
    return {
      tenantId: this.tenantId,
    };
  }
}

/**
 * Tenant Suspended Event
 *
 * Raised when a tenant is suspended.
 */
export class TenantSuspendedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: string,
    public readonly reason?: string,
  ) {
    super(tenantId, 'Tenant');
  }

  protected getPayload(): Record<string, unknown> {
    return {
      tenantId: this.tenantId,
      reason: this.reason,
    };
  }
}

/**
 * Tenant Deleted Event
 *
 * Raised when a tenant is deleted.
 */
export class TenantDeletedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: string,
    public readonly hardDelete = false,
  ) {
    super(tenantId, 'Tenant');
  }

  protected getPayload(): Record<string, unknown> {
    return {
      tenantId: this.tenantId,
      hardDelete: this.hardDelete,
    };
  }
}

/**
 * Tenant Trial Expired Event
 *
 * Raised when a tenant's trial period expires.
 */
export class TenantTrialExpiredEvent extends DomainEvent {
  constructor(public readonly tenantId: string) {
    super(tenantId, 'Tenant');
  }

  protected getPayload(): Record<string, unknown> {
    return {
      tenantId: this.tenantId,
    };
  }
}
