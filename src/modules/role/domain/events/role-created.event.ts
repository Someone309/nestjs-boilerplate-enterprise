import { DomainEvent } from '@core/domain/base';

/**
 * Role Created Event
 *
 * Raised when a new role is created.
 */
export class RoleCreatedEvent extends DomainEvent {
  constructor(
    public readonly roleId: string,
    public readonly name: string,
    public readonly tenantId: string,
    public readonly permissions: string[],
  ) {
    super(roleId, 'Role');
  }

  protected getPayload(): Record<string, unknown> {
    return {
      roleId: this.roleId,
      name: this.name,
      tenantId: this.tenantId,
      permissions: this.permissions,
    };
  }
}
