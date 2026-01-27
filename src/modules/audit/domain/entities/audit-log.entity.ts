import { Entity } from '@core/domain/base';

/**
 * Audit Action Types
 */
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SOFT_DELETE = 'SOFT_DELETE',
  RESTORE = 'RESTORE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',
  ROLE_REMOVED = 'ROLE_REMOVED',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
}

/**
 * Audit Log Entity Props
 */
export interface AuditLogProps {
  action: AuditAction;
  entityType: string;
  entityId: string;
  userId?: string;
  tenantId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Audit Log Entity
 *
 * Represents an audit trail entry for compliance and debugging.
 * Immutable after creation - audit logs should never be modified.
 *
 * Section 3.3: Optional Feature Modules - AuditModule
 */
export class AuditLog extends Entity {
  private readonly _action: AuditAction;
  private readonly _entityType: string;
  private readonly _entityId: string;
  private readonly _userId?: string;
  private readonly _tenantId?: string;
  private readonly _oldValues?: Record<string, unknown>;
  private readonly _newValues?: Record<string, unknown>;
  private readonly _ipAddress?: string;
  private readonly _userAgent?: string;
  private readonly _metadata?: Record<string, unknown>;

  private constructor(id: string, props: AuditLogProps, createdAt?: Date) {
    super(id);
    this._action = props.action;
    this._entityType = props.entityType;
    this._entityId = props.entityId;
    this._userId = props.userId;
    this._tenantId = props.tenantId;
    this._oldValues = props.oldValues;
    this._newValues = props.newValues;
    this._ipAddress = props.ipAddress;
    this._userAgent = props.userAgent;
    this._metadata = props.metadata;

    if (createdAt) {
      this._createdAt = createdAt;
    }
  }

  /**
   * Create a new audit log entry
   */
  static create(id: string, props: AuditLogProps): AuditLog {
    return new AuditLog(id, props);
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(id: string, props: AuditLogProps, createdAt: Date): AuditLog {
    return new AuditLog(id, props, createdAt);
  }

  // Getters (no setters - immutable)

  get action(): AuditAction {
    return this._action;
  }

  get entityType(): string {
    return this._entityType;
  }

  get entityId(): string {
    return this._entityId;
  }

  get userId(): string | undefined {
    return this._userId;
  }

  get tenantId(): string | undefined {
    return this._tenantId;
  }

  get oldValues(): Record<string, unknown> | undefined {
    return this._oldValues ? { ...this._oldValues } : undefined;
  }

  get newValues(): Record<string, unknown> | undefined {
    return this._newValues ? { ...this._newValues } : undefined;
  }

  get ipAddress(): string | undefined {
    return this._ipAddress;
  }

  get userAgent(): string | undefined {
    return this._userAgent;
  }

  get metadata(): Record<string, unknown> | undefined {
    return this._metadata ? { ...this._metadata } : undefined;
  }

  /**
   * Get changed fields (diff between old and new values)
   */
  getChangedFields(): string[] {
    if (!this._oldValues || !this._newValues) {
      return [];
    }

    const allKeys = new Set([...Object.keys(this._oldValues), ...Object.keys(this._newValues)]);

    return Array.from(allKeys).filter((key) => {
      const oldVal = JSON.stringify(this._oldValues?.[key]);
      const newVal = JSON.stringify(this._newValues?.[key]);
      return oldVal !== newVal;
    });
  }
}
