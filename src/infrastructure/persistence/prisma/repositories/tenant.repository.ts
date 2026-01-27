import { Injectable, Inject } from '@nestjs/common';
import { Tenant, TenantStatus } from '@modules/tenant/domain/entities/tenant.entity';
import type {
  ITenantRepository,
  TenantFilterCriteria,
} from '@modules/tenant/domain/repositories/tenant.repository.interface';
import { PRISMA_CLIENT } from '../prisma.module';
import { BasePrismaRepository, type IPrismaMapper } from '../base/base-repository.prisma';

/**
 * Prisma Tenant Type
 */
interface PrismaTenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  settings: Record<string, unknown>;
  ownerId: string | null;
  trialEndsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Tenant Mapper for Prisma
 */
class PrismaTenantMapper implements IPrismaMapper<Tenant, PrismaTenant> {
  private mapPrismaStatusToDomain(status: string): TenantStatus {
    const mapping: Record<string, TenantStatus> = {
      ACTIVE: TenantStatus.ACTIVE,
      INACTIVE: TenantStatus.INACTIVE,
      TRIAL: TenantStatus.TRIAL,
      SUSPENDED: TenantStatus.SUSPENDED,
    };
    return mapping[status] || TenantStatus.ACTIVE;
  }

  private mapDomainStatusToPrisma(status: TenantStatus): string {
    const mapping: Record<TenantStatus, string> = {
      [TenantStatus.ACTIVE]: 'ACTIVE',
      [TenantStatus.INACTIVE]: 'INACTIVE',
      [TenantStatus.TRIAL]: 'TRIAL',
      [TenantStatus.SUSPENDED]: 'SUSPENDED',
    };
    return mapping[status] || 'ACTIVE';
  }

  toDomain(prismaModel: PrismaTenant): Tenant {
    return Tenant.reconstitute(prismaModel.id, {
      name: prismaModel.name,
      slug: prismaModel.slug,
      status: this.mapPrismaStatusToDomain(prismaModel.status),
      settings: prismaModel.settings || {},
      ownerId: prismaModel.ownerId || undefined,
      trialEndsAt: prismaModel.trialEndsAt || undefined,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
    });
  }

  toPersistence(entity: Tenant): Record<string, unknown> {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      status: this.mapDomainStatusToPrisma(entity.status),
      settings: entity.settings,
      ownerId: entity.ownerId || null,
      trialEndsAt: entity.trialEndsAt || null,
    };
  }

  toDomainList(prismaModels: PrismaTenant[]): Tenant[] {
    return prismaModels.map((model) => this.toDomain(model));
  }
}

/**
 * Prisma Tenant Repository Implementation
 *
 * Implements ITenantRepository using Prisma.
 *
 * Section 8.3: Repository Contract
 * Section 8.6: Database Switching Guide - Prisma implementation
 */
@Injectable()
export class PrismaTenantRepository
  extends BasePrismaRepository<Tenant, PrismaTenant, TenantFilterCriteria>
  implements ITenantRepository
{
  private readonly tenantMapper: PrismaTenantMapper;
  private readonly prisma: PrismaClientType;

  constructor(
    @Inject(PRISMA_CLIENT)
    prismaClient: PrismaClientType,
  ) {
    const mapper = new PrismaTenantMapper();
    super(prismaClient.tenant, mapper);
    this.tenantMapper = mapper;
    this.prisma = prismaClient;
  }

  protected toWhereClause(criteria: TenantFilterCriteria): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (criteria.name) {
      where.name = { contains: criteria.name, mode: 'insensitive' };
    }

    if (criteria.slug) {
      where.slug = criteria.slug;
    }

    if (criteria.status) {
      where.status = criteria.status.toUpperCase();
    }

    if (criteria.ownerId) {
      where.ownerId = criteria.ownerId;
    }

    return where;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug },
    });

    return tenant ? this.tenantMapper.toDomain(tenant) : null;
  }

  async findByOwner(ownerId: string): Promise<Tenant[]> {
    const tenants = await this.prisma.tenant.findMany({
      where: { ownerId },
    });

    return this.tenantMapper.toDomainList(tenants);
  }

  async slugExists(slug: string, excludeTenantId?: string): Promise<boolean> {
    const where: Record<string, unknown> = { slug };

    if (excludeTenantId) {
      where.id = { not: excludeTenantId };
    }

    const count = await this.prisma.tenant.count({ where });
    return count > 0;
  }

  async findExpiredTrials(): Promise<Tenant[]> {
    const tenants = await this.prisma.tenant.findMany({
      where: {
        status: 'TRIAL',
        trialEndsAt: { lt: new Date() },
      },
    });

    return this.tenantMapper.toDomainList(tenants);
  }
}

/**
 * Prisma Client Type (dynamic)
 */
interface PrismaClientType {
  tenant: {
    findUnique: (args: unknown) => Promise<PrismaTenant | null>;
    findFirst: (args: unknown) => Promise<PrismaTenant | null>;
    findMany: (args: unknown) => Promise<PrismaTenant[]>;
    count: (args: unknown) => Promise<number>;
    create: (args: unknown) => Promise<PrismaTenant>;
    update: (args: unknown) => Promise<PrismaTenant>;
    upsert: (args: unknown) => Promise<PrismaTenant>;
    delete: (args: unknown) => Promise<PrismaTenant>;
  };
  [key: string]: unknown;
}
