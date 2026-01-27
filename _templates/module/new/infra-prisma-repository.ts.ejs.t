---
to: src/infrastructure/persistence/prisma/repositories/<%= name %>.repository.ts
---
import { Injectable } from '@nestjs/common';
import type { PaginatedResult, PaginationParams, SortParams } from '@core/domain/ports/repositories';
import { <%= h.changeCase.pascal(name) %> } from '@modules/<%= name %>/domain/entities/<%= name %>.entity';
import type {
  I<%= h.changeCase.pascal(name) %>Repository,
  <%= h.changeCase.pascal(name) %>FilterCriteria,
} from '@modules/<%= name %>/domain/repositories/<%= name %>.repository.interface';
import { PrismaService } from '../prisma.service';
import type { <%= h.changeCase.pascal(name) %> as Prisma<%= h.changeCase.pascal(name) %> } from '@prisma/client';
import { BasePrismaRepository, type IPrismaMapper } from '../base/base-repository.prisma';

/**
 * <%= h.changeCase.pascal(name) %> Mapper for Prisma
 */
class Prisma<%= h.changeCase.pascal(name) %>Mapper implements IPrismaMapper<<%= h.changeCase.pascal(name) %>, Prisma<%= h.changeCase.pascal(name) %>> {
  toDomain(prismaModel: Prisma<%= h.changeCase.pascal(name) %>): <%= h.changeCase.pascal(name) %> {
    return <%= h.changeCase.pascal(name) %>.reconstitute(prismaModel.id, {
      name: prismaModel.name,
      description: prismaModel.description ?? undefined,
      tenantId: prismaModel.tenantId,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
    });
  }

  toPersistence(entity: <%= h.changeCase.pascal(name) %>): Record<string, unknown> {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      tenantId: entity.tenantId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  toDomainList(prismaModels: Prisma<%= h.changeCase.pascal(name) %>[]): <%= h.changeCase.pascal(name) %>[] {
    return prismaModels.map((model) => this.toDomain(model));
  }
}

/**
 * Prisma <%= h.changeCase.pascal(name) %> Repository Implementation
 *
 * Section 8.3: Repository Contract
 * Section 8.6: Database Switching Guide - Prisma implementation
 */
@Injectable()
export class Prisma<%= h.changeCase.pascal(name) %>Repository
  extends BasePrismaRepository<<%= h.changeCase.pascal(name) %>, Prisma<%= h.changeCase.pascal(name) %>, <%= h.changeCase.pascal(name) %>FilterCriteria>
  implements I<%= h.changeCase.pascal(name) %>Repository
{
  private readonly <%= h.changeCase.camel(name) %>Mapper: Prisma<%= h.changeCase.pascal(name) %>Mapper;

  constructor(private readonly prisma: PrismaService) {
    const mapper = new Prisma<%= h.changeCase.pascal(name) %>Mapper();
    super(prisma.<%= h.changeCase.camel(name) %> as any, mapper);
    this.<%= h.changeCase.camel(name) %>Mapper = mapper;
  }

  protected toWhereClause(criteria: <%= h.changeCase.pascal(name) %>FilterCriteria): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (criteria.name) {
      where.name = { contains: criteria.name, mode: 'insensitive' };
    }

    if (criteria.tenantId) {
      where.tenantId = criteria.tenantId;
    }

    return where;
  }

  async findByName(name: string, tenantId: string): Promise<<%= h.changeCase.pascal(name) %> | null> {
    const record = await this.prisma.<%= h.changeCase.camel(name) %>.findFirst({
      where: { name, tenantId },
    });
    return record ? this.<%= h.changeCase.camel(name) %>Mapper.toDomain(record) : null;
  }

  async findByTenant(tenantId: string): Promise<<%= h.changeCase.pascal(name) %>[]> {
    const records = await this.prisma.<%= h.changeCase.camel(name) %>.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return this.<%= h.changeCase.camel(name) %>Mapper.toDomainList(records);
  }
}
