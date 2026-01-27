import { AggregateRoot } from '@core/domain/base';

/**
 * Role Props Interface
 */
export interface RoleProps {
  name: string;
  description?: string;
  permissions: string[];
  tenantId: string;
  isSystem: boolean;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Role Entity
 *
 * Aggregate root for role management (RBAC).
 *
 * Section 7.4: Security - Auion with RBAC
 */
export class Role extends AggregateRoot {
  private _name: string;
  private _description?: string;
  private _permissions: string[];
  private _tenantId: string;
  private _isSystem: boolean;
  private _isDefault: boolean;

  private constructor(id: string, props: RoleProps) {
    super(id);
    this._name = props.name;
    this._description = props.description;
    this._permissions = [...props.permissions];
    this._tenantId = props.tenantId;
    this._isSystem = props.isSystem;
    this._isDefault = props.isDefault ?? false;
    if (props.createdAt) {
      this._createdAt = props.createdAt;
    }
    if (props.updatedAt) {
      this._updatedAt = props.updatedAt;
    }
  }

  /**
   * Create a new role
   */
  static create(id: string, props: RoleProps): Role {
    return new Role(id, props);
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(id: string, props: RoleProps): Role {
    return new Role(id, props);
  }

  // Getters
  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get permissions(): readonly string[] {
    return this._permissions;
  }

  get tenantId(): string {
    return this._tenantId;
  }

  get isSystem(): boolean {
    return this._isSystem;
  }

  get isDefault(): boolean {
    return this._isDefault;
  }

  // Behaviors
  updateName(name: string): void {
    if (this._isSystem) {
      throw new Error('Cannot modify system role');
    }
    this._name = name;
    this.markUpdated();
  }

  updateDescription(description: string): void {
    this._description = description;
    this.markUpdated();
  }

  setPermissions(permissions: string[]): void {
    if (this._isSystem) {
      throw new Error('Cannot modify system role permissions');
    }
    this._permissions = [...permissions];
    this.markUpdated();
  }

  addPermission(permission: string): void {
    if (!this._permissions.includes(permission)) {
      this._permissions.push(permission);
      this.markUpdated();
    }
  }

  removePermission(permission: string): void {
    if (this._isSystem) {
      throw new Error('Cannot modify system role permissions');
    }
    const index = this._permissions.indexOf(permission);
    if (index !== -1) {
      this._permissions.splice(index, 1);
      this.markUpdated();
    }
  }

  hasPermission(permission: string): boolean {
    return this._permissions.includes(permission);
  }

  setDefault(isDefault: boolean): void {
    this._isDefault = isDefault;
    this.markUpdated();
  }
}
