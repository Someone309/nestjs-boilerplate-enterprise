import { DomainEvent } from '@core/domain/base';

/**
 * Tenant Updated Event Payload
 */
export interface TenantUpdatedPayload {
  name?: string;
  status?: string;
  settings?: Record<string, unknown>;
}

/**
 * Tenant Updated Event
 *
 * Raised when tenant data is modified.
 */
export class TenantUpdatedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: string,
    public readonly changes: TenantUpdatedPayload,
  ) {
    super(tenantId, 'Tenant');
  }

  protected getPayload(): Record<string, unknown> {
    return {
      tenantId: this.tenantId,
      changes: this.changes,
    };
  }
}
