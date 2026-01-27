import type { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import type { AggregateRoot } from '@core/domain/base';
import type {
  IRepository,
  FilterCriteria,
  PaginationParams,
  SortParams,
  PaginatedResult,
} from '@core/domain/ports/repositories';

/**
 * Mapper Interface
 * Converts between Domain Entity and TypeORM Entity
 */
export interface IMapper<TDomain, TOrm> {
  toDomain(ormEntity: TOrm): TDomain;
  toPersistence(domainEntity: TDomain): TOrm;
  toDomainList(ormEntities: TOrm[]): TDomain[];
}

/**
 * Base TypeORM Repository
 *
 * Abstract base class for TypeORM repository implementations.
 * Implements the IRepository interface from Domain layer.
 *
 * Section 8.3: Repository Contract
 * Section 8.6: Database Switching Guide - Repository implementations
 */
export abstract class BaseTypeOrmRepository<
  TAggregate extends AggregateRoot,
  TOrmEntity extends ObjectLiteral,
  TFilter extends FilterCriteria = FilterCriteria,
> implements IRepository<TAggregate, string, TFilter> {
  constructor(
    protected readonly repository: Repository<TOrmEntity>,
    protected readonly mapper: IMapper<TAggregate, TOrmEntity>,
  ) {}

  /**
   * Convert filter criteria to TypeORM where clause
   * Override in subclass for specific entity filters
   */
  protected abstract toWhereClause(criteria: TFilter): FindOptionsWhere<TOrmEntity>;

  async findById(id: string): Promise<TAggregate | null> {
    const entity = await this.repository.findOne({
      where: { id } as unknown as FindOptionsWhere<TOrmEntity>,
    });

    if (!entity) {
      return null;
    }

    return this.mapper.toDomain(entity);
  }

  async findOne(criteria: TFilter): Promise<TAggregate | null> {
    const whereClause = this.toWhereClause(criteria);
    const entity = await this.repository.findOne({ where: whereClause });

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

    const order: Record<string, 'ASC' | 'DESC'> = {};
    if (sort) {
      order[sort.field] = sort.order;
    } else {
      order.createdAt = 'DESC';
    }

    const [entities, total] = await this.repository.findAndCount({
      where: whereClause,
      skip,
      take: limit,
      order: order as never,
    });

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
    const ormEntity = this.mapper.toPersistence(entity);
    const savedEntity = await this.repository.save(ormEntity);
    return this.mapper.toDomain(savedEntity);
  }

  async saveMany(entities: TAggregate[]): Promise<TAggregate[]> {
    const ormEntities = entities.map((e) => this.mapper.toPersistence(e));
    const savedEntities = await this.repository.save(ormEntities);
    return this.mapper.toDomainList(savedEntities);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  async exists(criteria: TFilter): Promise<boolean> {
    const whereClause = this.toWhereClause(criteria);
    const count = await this.repository.count({ where: whereClause });
    return count > 0;
  }

  async count(criteria: TFilter): Promise<number> {
    const whereClause = this.toWhereClause(criteria);
    return this.repository.count({ where: whereClause });
  }
}
