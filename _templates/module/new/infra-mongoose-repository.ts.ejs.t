---
to: src/infrastructure/persistence/mongoose/repositories/<%= name %>.repository.ts
---
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, Document } from 'mongoose';
import type { PaginatedResult, PaginationParams, SortParams } from '@core/domain/ports/repositories';
import { <%= h.changeCase.pascal(name) %> } from '@modules/<%= name %>/domain/entities/<%= name %>.entity';
import type {
  I<%= h.changeCase.pascal(name) %>Repository,
  <%= h.changeCase.pascal(name) %>FilterCriteria,
} from '@modules/<%= name %>/domain/repositories/<%= name %>.repository.interface';
import type { I<%= h.changeCase.pascal(name) %>Document } from '../schemas/<%= name %>.schema';
import { BaseMongooseRepository, type IMongooseMapper } from '../base/base-repository.mongoose';

/**
 * <%= h.changeCase.pascal(name) %> Document with Mongoose Document interface
 */
type <%= h.changeCase.pascal(name) %>Document = I<%= h.changeCase.pascal(name) %>Document & Document;

/**
 * <%= h.changeCase.pascal(name) %> Mapper for Mongoose
 */
class Mongoose<%= h.changeCase.pascal(name) %>Mapper implements IMongooseMapper<<%= h.changeCase.pascal(name) %>, <%= h.changeCase.pascal(name) %>Document> {
  toDomain(doc: <%= h.changeCase.pascal(name) %>Document): <%= h.changeCase.pascal(name) %> {
    return <%= h.changeCase.pascal(name) %>.reconstitute(doc._id.toString(), {
      name: doc.name,
      description: doc.description,
      tenantId: doc.tenantId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  toPersistence(entity: <%= h.changeCase.pascal(name) %>): Record<string, unknown> {
    return {
      name: entity.name,
      description: entity.description,
      tenantId: entity.tenantId,
    };
  }

  toDomainList(docs: <%= h.changeCase.pascal(name) %>Document[]): <%= h.changeCase.pascal(name) %>[] {
    return docs.map((doc) => this.toDomain(doc));
  }
}

/**
 * Mongoose <%= h.changeCase.pascal(name) %> Repository Implementation
 *
 * Section 8.3: Repository Contract
 * Section 8.6: Database Switching Guide - MongoDB implementation
 */
@Injectable()
export class Mongoose<%= h.changeCase.pascal(name) %>Repository
  extends BaseMongooseRepository<<%= h.changeCase.pascal(name) %>, <%= h.changeCase.pascal(name) %>Document, <%= h.changeCase.pascal(name) %>FilterCriteria>
  implements I<%= h.changeCase.pascal(name) %>Repository
{
  private readonly <%= h.changeCase.camel(name) %>Mapper: Mongoose<%= h.changeCase.pascal(name) %>Mapper;

  constructor(
    @InjectModel('<%= h.changeCase.pascal(name) %>')
    model: Model<<%= h.changeCase.pascal(name) %>Document>,
  ) {
    const mapper = new Mongoose<%= h.changeCase.pascal(name) %>Mapper();
    super(model, mapper);
    this.<%= h.changeCase.camel(name) %>Mapper = mapper;
  }

  protected toFilterQuery(criteria: <%= h.changeCase.pascal(name) %>FilterCriteria): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (criteria.name) {
      filter.name = { $regex: criteria.name, $options: 'i' };
    }

    if (criteria.tenantId) {
      filter.tenantId = criteria.tenantId;
    }

    return filter;
  }

  async findByName(name: string, tenantId: string): Promise<<%= h.changeCase.pascal(name) %> | null> {
    const doc = await this.model.findOne({ name, tenantId }).exec();
    return doc ? this.<%= h.changeCase.camel(name) %>Mapper.toDomain(doc) : null;
  }

  async findByTenant(tenantId: string): Promise<<%= h.changeCase.pascal(name) %>[]> {
    const docs = await this.model
      .find({ tenantId })
      .sort({ createdAt: -1 })
      .exec();
    return this.<%= h.changeCase.camel(name) %>Mapper.toDomainList(docs);
  }
}
