import { Injectable, Inject } from '@nestjs/common';
import { Role } from '@modules/role/domain/entities/role.entity';
import type {
  IRoleRepository,
  RoleFilterCriteria,
} from '@modules/role/domain/repositories/role.repository.interface';
import { PRISMA_CLIENT } from '../prisma.module';
import { BasePrismaRepository, type IPrismaMapper } from '../base/base-repository.prisma';

/**
 * Prisma Role Type
 */
interface PrismaRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Role Mapper for Prisma
 */
class PrismaRoleMapper implements IPrismaMapper<Role, PrismaRole> {
  toDomain(prismaModel: PrismaRole): Role {
    return Role.reconstitute(prismaModel.id, {
      name: prismaModel.name,
      description: prismaModel.description || undefined,
      permissions: prismaModel.permissions || [],
      tenantId: '', // Prisma roles may be global
      isSystem: prismaModel.isSystem,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
    });
  }

  toPersistence(entity: Role): Record<string, unknown> {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description || null,
      permissions: [...entity.permissions],
      isSystem: entity.isSystem,
    };
  }

  toDomainList(prismaModels: PrismaRole[]): Role[] {
    return prismaModels.map((model) => this.toDomain(model));
  }
}

/**
 * Prisma Role Repository Implementation
 *
 * Implements IRoleRepository using Prisma.
 *
 * Section 8.3: Repository Contract
 * Section 8.6: Database Switching Guide - Prisma implementation
 */
@Injectable()
export class PrismaRoleRepository
  extends BasePrismaRepository<Role, PrismaRole, RoleFilterCriteria>
  implements IRoleRepository
{
  private readonly roleMapper: PrismaRoleMapper;
  private readonly prisma: PrismaClientType;

  constructor(
    @Inject(PRISMA_CLIENT)
    prismaClient: PrismaClientType,
  ) {
    const mapper = new PrismaRoleMapper();
    super(prismaClient.role, mapper);
    this.roleMapper = mapper;
    this.prisma = prismaClient;
  }

  protected toWhereClause(criteria: RoleFilterCriteria): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (criteria.name) {
      where.name = criteria.name;
    }

    if (criteria.isSystem !== undefined) {
      where.isSystem = criteria.isSystem;
    }

    return where;
  }

  async findByName(name: string, _tenantId: string): Promise<Role | null> {
    const role = await this.prisma.role.findFirst({
      where: { name },
    });

    return role ? this.roleMapper.toDomain(role) : null;
  }

  async findSystemRoles(): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      where: { isSystem: true },
    });

    return this.roleMapper.toDomainList(roles);
  }

  async findByIds(ids: string[]): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      where: { id: { in: ids } },
    });

    return this.roleMapper.toDomainList(roles);
  }
}

/**
 * Prisma Client Type (dynamic)
 */
interface PrismaClientType {
  role: {
    findUnique: (args: unknown) => Promise<PrismaRole | null>;
    findFirst: (args: unknown) => Promise<PrismaRole | null>;
    findMany: (args: unknown) => Promise<PrismaRole[]>;
    count: (args: unknown) => Promise<number>;
    create: (args: unknown) => Promise<PrismaRole>;
    update: (args: unknown) => Promise<PrismaRole>;
    upsert: (args: unknown) => Promise<PrismaRole>;
    delete: (args: unknown) => Promise<PrismaRole>;
  };
  [key: string]: unknown;
}
