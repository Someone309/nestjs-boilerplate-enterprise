import { createBaseSchema } from '../base/base-schema.mongoose';

/**
 * Tenant Status Enum
 */
export enum MongoTenantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TRIAL = 'TRIAL',
  SUSPENDED = 'SUSPENDED',
}

/**
 * Tenant Document Interface
 */
export interface ITenantDocument {
  _id: string;
  name: string;
  slug: string;
  status: MongoTenantStatus;
  settings: Record<string, unknown>;
  ownerId?: string;
  trialEndsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Tenant Schema for MongoDB
 *
 * Maps to the Tenant domain entity.
 */
export const TenantSchema = createBaseSchema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  status: {
    type: String,
    enum: Object.values(MongoTenantStatus),
    default: MongoTenantStatus.ACTIVE,
  },
  settings: {
    type: Object,
    default: {},
  },
  ownerId: {
    type: String,
  },
  trialEndsAt: {
    type: Date,
  },
});

// Indexes
TenantSchema.index({ status: 1 });
TenantSchema.index({ ownerId: 1 });
