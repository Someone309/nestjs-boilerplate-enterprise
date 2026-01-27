import { Schema, type SchemaOptions } from 'mongoose';
import { baseSchemaOptions } from '../base/base-schema.mongoose';

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
}

/**
 * Audit Log Document Interface
 */
export interface IAuditLogDocument {
  _id: string;
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
  createdAt: Date;
}

/**
 * Audit schema options
 */
const auditSchemaOptions: SchemaOptions = {
  ...baseSchemaOptions,
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'audit_logs',
};

/**
 * Audit Log Schema for MongoDB
 *
 * Stores audit trail for compliance and debugging.
 * Designed for high-volume insert, time-based queries.
 */
export const AuditLogSchema = new Schema(
  {
    _id: { type: String },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    tenantId: {
      type: String,
      index: true,
    },
    oldValues: {
      type: Object,
    },
    newValues: {
      type: Object,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    metadata: {
      type: Object,
    },
  },
  auditSchemaOptions,
);

// Compound indexes for common queries
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ tenantId: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 }); // For time-based pagination

// TTL index - auto-delete after 2 years (configurable)
// AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });
