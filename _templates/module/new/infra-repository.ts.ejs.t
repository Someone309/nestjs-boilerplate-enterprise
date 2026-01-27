---
to: src/infrastructure/persistence/typeorm/repositories/<%= name %>.repository.ts
---
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { <%= h.changeCase.pascal(name) %>Entity } from '../entities/<%= name %>.entity';
import { <%= h.changeCase.pascal(name) %> } from '@modules/<%= name %>/domain/entities/<%= name %>.entity';
import type {
  I<%= h.changeCase.pascal(name) %>Repository,
  <%= h.changeCase.pascal(name) %>FilterCriteria,
} from '@modules/<%= name %>/domain/repositories/<%= name %>.repository.interface';
import type { PaginatedResult, PaginationParams, SortParams } from '@core/domain/ports/repositories';

/**
 * TypeORM <%= h.changeCase.pascal(name) %> Repository Implementation
 *
 * Note: For multi-database support, you may also need to create:
 * - Mongoose repository: src/infrastructure/persistence/mongoose/repositories/<%= name %>.repository.ts
 * - Prisma repository: src/infrastructure/persistence/prisma/repositories/<%= name %>.repository.ts
 *
 * See Section 8.6: Database Switching Guide
 */
@Injectable()
export class TypeOrm<%= h.changeCase.pascal(name) %>Repository implements I<%= h.changeCase.pascal(name) %>Repository {
  constructor(
    @InjectRepository(<%= h.changeCase.pascal(name) %>Entity)
    private readonly repository: Repository<<%= h.changeCase.pascal(name) %>Entity>,
  ) {}

  async findById(id: string): Promise<<%= h.changeCase.pascal(name) %> | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findOne(criteria: <%= h.changeCase.pascal(name) %>FilterCriteria): Promise<<%= h.changeCase.pascal(name) %> | null> {
    const entity = await this.repository.findOne({ where: criteria as Record<string, unknown> });
    return entity ? this.toDomain(entity) : null;
  }

  async findMany(
    criteria: <%= h.changeCase.pascal(name) %>FilterCriteria,
    pagination?: PaginationParams,
    sort?: SortParams,
  ): Promise<PaginatedResult<<%= h.changeCase.pascal(name) %>>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const [entities, total] = await this.repository.findAndCount({
      where: criteria as Record<string, unknown>,
      skip,
      take: limit,
      order: sort ? { [sort.field]: sort.order } : { createdAt: 'DESC' },
    });

    return {
      data: entities.map((e) => this.toDomain(e)),
      total,
      page,
      limit,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  async save(<%= h.changeCase.camel(name) %>: <%= h.changeCase.pascal(name) %>): Promise<<%= h.changeCase.pascal(name) %>> {
    const entity = this.toEntity(<%= h.changeCase.camel(name) %>);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async exists(criteria: <%= h.changeCase.pascal(name) %>FilterCriteria): Promise<boolean> {
    const count = await this.repository.count({ where: criteria as Record<string, unknown> });
    return count > 0;
  }

  async count(criteria: <%= h.changeCase.pascal(name) %>FilterCriteria): Promise<number> {
    return this.repository.count({ where: criteria as Record<string, unknown> });
  }

  async findByName(name: string, tenantId: string): Promise<<%= h.changeCase.pascal(name) %> | null> {
    const entity = await this.repository.findOne({
      where: { name, tenantId },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByTenant(tenantId: string): Promise<<%= h.changeCase.pascal(name) %>[]> {
    const entities = await this.repository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(entity: <%= h.changeCase.pascal(name) %>Entity): <%= h.changeCase.pascal(name) %> {
    return <%= h.changeCase.pascal(name) %>.reconstitute(entity.id, {
      name: entity.name,
      description: entity.description,
      tenantId: entity.tenantId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(<%= h.changeCase.camel(name) %>: <%= h.changeCase.pascal(name) %>): Partial<<%= h.changeCase.pascal(name) %>Entity> {
    return {
      id: <%= h.changeCase.camel(name) %>.id,
      name: <%= h.changeCase.camel(name) %>.name,
      description: <%= h.changeCase.camel(name) %>.description,
      tenantId: <%= h.changeCase.camel(name) %>.tenantId,
    };
  }
}
