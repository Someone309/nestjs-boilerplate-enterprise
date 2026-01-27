import { DomainEvent } from '@core/domain/base';

/**
 * Tenant Created Event
 *
 * Raised when a new tenant is created.
 */
export class TenantCreatedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly ownerId?: string,
  ) {
    super(tenantId, 'Tenant');
  }

  protected getPayload(): Record<string, unknown> {
    return {
      tenantId: this.tenantId,
      name: this.name,
      slug: this.slug,
      ownerId: this.ownerId,
    };
  }
}
