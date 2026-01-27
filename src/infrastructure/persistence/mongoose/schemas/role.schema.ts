import { createBaseSchema } from '../base/base-schema.mongoose';

/**
 * Role Document Interface
 */
export interface IRoleDocument {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Role Schema for MongoDB
 *
 * Maps to the Role domain entity.
 */
export const RoleSchema = createBaseSchema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  description: {
    type: String,
    trim: true,
  },
  permissions: [
    {
      type: String,
    },
  ],
  isSystem: {
    type: Boolean,
    default: false,
  },
});

// Indexes
RoleSchema.index({ isSystem: 1 });
