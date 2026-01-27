import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, type FindOptionsWhere } from 'typeorm';
import type {
  PaginationParams,
  PaginatedResult,
  SortParams,
} from '@core/domain/ports/repositories';
import { AuditLog, AuditAction } from '../../domain/entities/audit-log.entity';
import type {
  IAuditLogRepository,
  AuditLogFilter,
} from '../../domain/repositories/audit-log.repository.interface';
import { AuditLogEntity } from '../entities/audit-log.typeorm.entity';

/**
 * TypeORM Audit Log Repository
 *
 * Implements IAuditLogRepository for PostgreSQL/MySQL.
 */
@Injectable()
export class AuditLogRepository implements IAuditLogRepository {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repository: Repository<AuditLogEntity>,
  ) {}

  async create(auditLog: AuditLog): Promise<AuditLog> {
    const entity = this.toEntity(auditLog);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async createMany(auditLogs: AuditLog[]): Promise<void> {
    const entities = auditLogs.map((log) => this.toEntity(log));
    await this.repository.save(entities);
  }

  async findMany(
    filter: AuditLogFilter,
    pagination?: PaginationParams,
    sort?: SortParams,
  ): Promise<PaginatedResult<AuditLog>> {
    const where = this.buildWhereClause(filter);

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
      where,
      skip,
      take: limit,
      order,
    });

    const data = entities.map((e) => this.toDomain(e));
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

  async findByEntity(
    entityType: string,
    entityId: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<AuditLog>> {
    return this.findMany({ entityType, entityId }, pagination, {
      field: 'createdAt',
      order: 'DESC',
    });
  }

  async findByUser(
    userId: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<AuditLog>> {
    return this.findMany({ userId }, pagination, { field: 'createdAt', order: 'DESC' });
  }

  async count(filter: AuditLogFilter): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.repository.count({ where });
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.repository.delete({
      createdAt: LessThan(date),
    });
    return result.affected ?? 0;
  }

  private buildWhereClause(filter: AuditLogFilter): FindOptionsWhere<AuditLogEntity> {
    const where: FindOptionsWhere<AuditLogEntity> = {};

    if (filter.action) {
      where.action = filter.action;
    }

    if (filter.entityType) {
      where.entityType = filter.entityType;
    }

    if (filter.entityId) {
      where.entityId = filter.entityId;
    }

    if (filter.userId) {
      where.userId = filter.userId;
    }

    if (filter.tenantId) {
      where.tenantId = filter.tenantId;
    }

    if (filter.startDate && filter.endDate) {
      where.createdAt = Between(filter.startDate, filter.endDate);
    }

    return where;
  }

  private toEntity(domain: AuditLog): AuditLogEntity {
    const entity = new AuditLogEntity();
    entity.id = domain.id;
    entity.action = domain.action;
    entity.entityType = domain.entityType;
    entity.entityId = domain.entityId;
    entity.userId = domain.userId;
    entity.tenantId = domain.tenantId;
    entity.oldValues = domain.oldValues;
    entity.newValues = domain.newValues;
    entity.ipAddress = domain.ipAddress;
    entity.userAgent = domain.userAgent;
    entity.metadata = domain.metadata;
    return entity;
  }

  private toDomain(entity: AuditLogEntity): AuditLog {
    return AuditLog.reconstitute(
      entity.id,
      {
        action: entity.action as AuditAction,
        entityType: entity.entityType,
        entityId: entity.entityId,
        userId: entity.userId,
        tenantId: entity.tenantId,
        oldValues: entity.oldValues,
        newValues: entity.newValues,
        ipAddress: entity.ipAddress,
        userAgent: entity.userAgent,
        metadata: entity.metadata,
      },
      entity.createdAt,
    );
  }
}
