import { DomainEvent } from '@core/domain/base';

/**
 * Role Assigned Event
 *
 * Raised when a role is assigned to a user.
 */
export class RoleAssignedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
    public readonly roleName: string,
    public readonly tenantId: string,
  ) {
    super(userId, 'User');
  }

  protected getPayload(): Record<string, unknown> {
    return {
      userId: this.userId,
      roleId: this.roleId,
      roleName: this.roleName,
      tenantId: this.tenantId,
    };
  }
}

/**
 * Role Unassigned Event
 *
 * Raised when a role is removed from a user.
 */
export class RoleUnassignedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
    public readonly roleName: string,
    public readonly tenantId: string,
  ) {
    super(userId, 'User');
  }

  protected getPayload(): Record<string, unknown> {
    return {
      userId: this.userId,
      roleId: this.roleId,
      roleName: this.roleName,
      tenantId: this.tenantId,
    };
  }
}
