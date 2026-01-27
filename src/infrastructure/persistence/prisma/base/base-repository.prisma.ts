import type { AggregateRoot } from '@core/domain/base';
import type {
  IRepository,
  FilterCriteria,
  PaginationParams,
  SortParams,
  PaginatedResult,
} from '@core/domain/ports/repositories';

/**
 * Prisma Client Type
 * Generic type for Prisma client delegate
 */
export interface PrismaDelegate<T> {
  findUnique: (args: { where: { id: string } }) => Promise<T | null>;
  findFirst: (args: { where: Record<string, unknown> }) => Promise<T | null>;
  findMany: (args: {
    where?: Record<string, unknown>;
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }) => Promise<T[]>;
  count: (args: { where?: Record<string, unknown> }) => Promise<number>;
  create: (args: { data: Record<string, unknown> }) => Promise<T>;
  update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<T>;
  upsert: (args: {
    where: { id: string };
    create: Record<string, unknown>;
    update: Record<string, unknown>;
  }) => Promise<T>;
  delete: (args: { where: { id: string } }) => Promise<T>;
}

/**
 * Mapper Interface for Prisma
 * Converts between Domain Entity and Prisma Model
 */
export interface IPrismaMapper<TDomain, TPrisma> {
  toDomain(prismaModel: TPrisma): TDomain;
  toPersistence(domainEntity: TDomain): Record<string, unknown>;
  toDomainList(prismaModels: TPrisma[]): TDomain[];
}

/**
 * Base Prisma Repository
 *
 * Abstract base class for Prisma repository implementations.
 * Implements the IRepository interface from Domain layer.
 *
 * Section 8.3: Repository Contract
 * Section 8.6: Database Switching Guide - Prisma implementation
 */
export abstract class BasePrismaRepository<
  TAggregate extends AggregateRoot,
  TPrismaModel,
  TFilter extends FilterCriteria = FilterCriteria,
> implements IRepository<TAggregate, string, TFilter> {
  constructor(
    protected readonly delegate: PrismaDelegate<TPrismaModel>,
    protected readonly mapper: IPrismaMapper<TAggregate, TPrismaModel>,
  ) {}

  /**
   * Convert filter criteria to Prisma where clause
   * Override in subclass for specific entity filters
   */
  protected abstract toWhereClause(criteria: TFilter): Record<string, unknown>;

  async findById(id: string): Promise<TAggregate | null> {
    const entity = await this.delegate.findUnique({ where: { id } });

    if (!entity) {
      return null;
    }

    return this.mapper.toDomain(entity);
  }

  async findOne(criteria: TFilter): Promise<TAggregate | null> {
    const whereClause = this.toWhereClause(criteria);
    const entity = await this.delegate.findFirst({ where: whereClause });

    if (!entity) {
      return null;
    }

    return this.mapper.toDomain(entity);
  }

  async findMany(
    criteria: TFilter,
    pagination?: PaginationParams,
    sort?: SortParams,
  ): Promise<PaginatedResult<TAggregate>> {
    const whereClause = this.toWhereClause(criteria);

    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = pagination?.offset ?? (page - 1) * limit;

    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (sort) {
      orderBy[sort.field] = sort.order.toLowerCase() as 'asc' | 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [entities, total] = await Promise.all([
      this.delegate.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
      }),
      this.delegate.count({ where: whereClause }),
    ]);

    const data = this.mapper.toDomainList(entities);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async save(entity: TAggregate): Promise<TAggregate> {
    const data = this.mapper.toPersistence(entity);
    const savedEntity = await this.delegate.upsert({
      where: { id: entity.id },
      create: data,
      update: data,
    });
    return this.mapper.toDomain(savedEntity);
  }

  async saveMany(entities: TAggregate[]): Promise<TAggregate[]> {
    const results: TAggregate[] = [];
    for (const entity of entities) {
      const saved = await this.save(entity);
      results.push(saved);
    }
    return results;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.delegate.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async softDelete(id: string): Promise<boolean> {
    try {
      await this.delegate.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }

  async exists(criteria: TFilter): Promise<boolean> {
    const whereClause = this.toWhereClause(criteria);
    const count = await this.delegate.count({ where: whereClause });
    return count > 0;
  }

  async count(criteria: TFilter): Promise<number> {
    const whereClause = this.toWhereClause(criteria);
    return this.delegate.count({ where: whereClause });
  }
}
