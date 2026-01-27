---
to: src/infrastructure/persistence/mongoose/schemas/<%= name %>.schema.ts
---
import { createBaseSchema } from '../base/base-schema.mongoose';

/**
 * <%= h.changeCase.pascal(name) %> Document Interface
 */
export interface I<%= h.changeCase.pascal(name) %>Document {
  _id: string;
  name: string;
  description?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * <%= h.changeCase.pascal(name) %> Schema for MongoDB
 *
 * Maps to the <%= h.changeCase.pascal(name) %> domain entity.
 * See Section 8.6: Database Switching Guide
 */
export const <%= h.changeCase.pascal(name) %>Schema = createBaseSchema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  description: {
    type: String,
    trim: true,
  },
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
});

// Indexes
<%= h.changeCase.pascal(name) %>Schema.index({ name: 1, tenantId: 1 });
