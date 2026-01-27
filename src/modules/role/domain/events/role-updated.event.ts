import { DomainEvent } from '@core/domain/base';

/**
 * Role Updated Event Payload
 */
export interface RoleUpdatedPayload {
  name?: string;
  description?: string;
  permissionsAdded?: string[];
  permissionsRemoved?: string[];
  isDefaultChanged?: boolean;
}

/**
 * Role Updated Event
 *
 * Raised when role data is modified.
 */
export class RoleUpdatedEvent extends DomainEvent {
  constructor(
    public readonly roleId: string,
    public readonly changes: RoleUpdatedPayload,
    public readonly tenantId: string,
  ) {
    super(roleId, 'Role');
  }

  protected getPayload(): Record<string, unknown> {
    return {
      roleId: this.roleId,
      changes: this.changes,
      tenantId: this.tenantId,
    };
  }
}
