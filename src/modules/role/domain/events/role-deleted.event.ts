import { DomainEvent } from '@core/domain/base';

/**
 * Role Deleted Event
 *
 * Raised when a role is deleted.
 */
export class RoleDeletedEvent extends DomainEvent {
  constructor(
    public readonly roleId: string,
    public readonly tenantId: string,
  ) {
    super(roleId, 'Role');
  }

  protected getPayload(): Record<string, unknown> {
    return {
      roleId: this.roleId,
      tenantId: this.tenantId,
    };
  }
}
