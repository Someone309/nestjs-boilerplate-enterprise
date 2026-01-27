import { Schema, type SchemaOptions } from 'mongoose';

/**
 * Base Schema Options
 *
 * Common options for all Mongoose schemas.
 * Implements conventions from architecture docs.
 */
export const baseSchemaOptions: SchemaOptions = {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  toJSON: {
    virtuals: true,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
};

/**
 * Create a base schema with common fields
 *
 * @example
 * const UserSchema = createBaseSchema({
 *   email: { type: String, required: true, unique: true },
 *   passwordHash: { type: String, required: true },
 * });
 */
export function createBaseSchema(
  definition: Record<string, unknown>,
  options?: SchemaOptions,
): Schema {
  const schema = new Schema(
    {
      _id: { type: String }, // Use string UUIDs instead of ObjectId
      ...definition,
      deletedAt: { type: Date, default: null },
    },
    {
      ...baseSchemaOptions,
      ...options,
    },
  );

  // Add soft delete query helper
  schema.pre(
    'find',
    function (this: {
      getQuery: () => Record<string, unknown>;
      where: (q: Record<string, unknown>) => void;
    }) {
      const query = this.getQuery();
      if (query.deletedAt === undefined) {
        this.where({ deletedAt: null });
      }
    },
  );

  schema.pre(
    'findOne',
    function (this: {
      getQuery: () => Record<string, unknown>;
      where: (q: Record<string, unknown>) => void;
    }) {
      const query = this.getQuery();
      if (query.deletedAt === undefined) {
        this.where({ deletedAt: null });
      }
    },
  );

  schema.pre(
    'countDocuments',
    function (this: {
      getQuery: () => Record<string, unknown>;
      where: (q: Record<string, unknown>) => void;
    }) {
      const query = this.getQuery();
      if (query.deletedAt === undefined) {
        this.where({ deletedAt: null });
      }
    },
  );

  return schema;
}

/**
 * Soft delete schema fields
 */
export const softDeleteFields = {
  deletedAt: { type: Date, default: null },
};

/**
 * Audit schema fields
 */
export const auditFields = {
  createdBy: { type: String },
  updatedBy: { type: String },
};
