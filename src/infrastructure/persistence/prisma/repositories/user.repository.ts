import { Injectable, Inject } from '@nestjs/common';
import type {
  PaginatedResult,
  PaginationParams,
  SortParams,
} from '@core/domain/ports/repositories';
import { User } from '@modules/user/domain/entities/user.entity';
import { UserStatus } from '@modules/user/domain/enums/user-status.enum';
import type {
  IUserRepository,
  UserFilterCriteria,
} from '@modules/user/domain/repositories/user.repository.interface';
import { Email } from '@modules/user/domain/value-objects/email.value-object';
import { Password } from '@modules/user/domain/value-objects/password.value-object';
import { PRISMA_CLIENT } from '../prisma.module';
import { BasePrismaRepository, type IPrismaMapper } from '../base/base-repository.prisma';

/**
 * Prisma User Type
 */
interface PrismaUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  emailVerified: boolean;
  tenantId: string | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  roles?: { role: { id: string } }[];
}

/**
 * User Mapper for Prisma
 */
class PrismaUserMapper implements IPrismaMapper<User, PrismaUser> {
  private mapPrismaStatusToDomain(status: string): UserStatus {
    const mapping: Record<string, UserStatus> = {
      ACTIVE: UserStatus.ACTIVE,
      INACTIVE: UserStatus.INACTIVE,
      PENDING_VERIFICATION: UserStatus.PENDING,
      SUSPENDED: UserStatus.SUSPENDED,
    };
    return mapping[status] || UserStatus.PENDING;
  }

  private mapDomainStatusToPrisma(status: UserStatus): string {
    const mapping: Record<UserStatus, string> = {
      [UserStatus.ACTIVE]: 'ACTIVE',
      [UserStatus.INACTIVE]: 'INACTIVE',
      [UserStatus.PENDING]: 'PENDING_VERIFICATION',
      [UserStatus.SUSPENDED]: 'SUSPENDED',
      [UserStatus.DELETED]: 'INACTIVE', // Map deleted to inactive for Prisma
    };
    return mapping[status] || 'PENDING_VERIFICATION';
  }

  toDomain(prismaModel: PrismaUser): User {
    return User.reconstitute(prismaModel.id, {
      email: Email.create(prismaModel.email),
      password: Password.fromHash(prismaModel.passwordHash),
      firstName: prismaModel.firstName || '',
      lastName: prismaModel.lastName || '',
      status: this.mapPrismaStatusToDomain(prismaModel.status),
      tenantId: prismaModel.tenantId || '',
      roleIds: prismaModel.roles?.map((r) => r.role.id) || [],
      emailVerified: prismaModel.emailVerified,
      lastLoginAt: prismaModel.lastLoginAt || undefined,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
    });
  }

  toPersistence(entity: User): Record<string, unknown> {
    return {
      id: entity.id,
      email: entity.email.value,
      passwordHash: entity.password.hashedValue,
      firstName: entity.firstName,
      lastName: entity.lastName,
      status: this.mapDomainStatusToPrisma(entity.status),
      tenantId: entity.tenantId || null,
      emailVerified: entity.emailVerified,
      lastLoginAt: entity.lastLoginAt || null,
    };
  }

  toDomainList(prismaModels: PrismaUser[]): User[] {
    return prismaModels.map((model) => this.toDomain(model));
  }
}

/**
 * Prisma User Repository Implementation
 *
 * Implements IUserRepository using Prisma.
 *
 * Section 8.3: Repository Contract
 * Section 8.6: Database Switching Guide - Prisma implementation
 */
@Injectable()
export class PrismaUserRepository
  extends BasePrismaRepository<User, PrismaUser, UserFilterCriteria>
  implements IUserRepository
{
  private readonly userMapper: PrismaUserMapper;
  private readonly prisma: PrismaClientType;

  constructor(
    @Inject(PRISMA_CLIENT)
    prismaClient: PrismaClientType,
  ) {
    const mapper = new PrismaUserMapper();
    super(prismaClient.user, mapper);
    this.userMapper = mapper;
    this.prisma = prismaClient;
  }

  protected toWhereClause(criteria: UserFilterCriteria): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (criteria.email) {
      where.email = criteria.email.toLowerCase();
    }

    if (criteria.status) {
      where.status = criteria.status;
    }

    if (criteria.tenantId) {
      where.tenantId = criteria.tenantId;
    }

    if (criteria.emailVerified !== undefined) {
      where.emailVerified = criteria.emailVerified;
    }

    if (criteria.roleId) {
      where.roles = {
        some: {
          roleId: criteria.roleId,
        },
      };
    }

    if (criteria.search) {
      where.OR = [
        { email: { contains: criteria.search, mode: 'insensitive' } },
        { firstName: { contains: criteria.search, mode: 'insensitive' } },
        { lastName: { contains: criteria.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    const user: PrismaUser | null = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        tenantId,
      },
      include: { roles: { include: { role: true } } },
    });

    return user ? this.userMapper.toDomain(user) : null;
  }

  async findByEmailGlobal(email: string): Promise<User | null> {
    const user: PrismaUser | null = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase() },
      include: { roles: { include: { role: true } } },
    });

    return user ? this.userMapper.toDomain(user) : null;
  }

  async findByRole(
    roleId: string,
    pagination?: PaginationParams,
    sort?: SortParams,
  ): Promise<PaginatedResult<User>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (sort) {
      orderBy[sort.field] = sort.order.toLowerCase() as 'asc' | 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const where = {
      roles: {
        some: { roleId },
      },
    };

    const [users, total]: [PrismaUser[], number] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { roles: { include: { role: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: this.userMapper.toDomainList(users),
      total,
      page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async emailExists(email: string, tenantId: string, excludeUserId?: string): Promise<boolean> {
    const where: Record<string, unknown> = {
      email: email.toLowerCase(),
      tenantId,
    };

    if (excludeUserId) {
      where.id = { not: excludeUserId };
    }

    const count = await this.prisma.user.count({ where });
    return count > 0;
  }

  async countActiveInTenant(tenantId: string): Promise<number> {
    return this.prisma.user.count({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
    });
  }

  async findPendingActivation(olderThan: Date): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        status: 'PENDING_VERIFICATION',
        createdAt: { lt: olderThan },
      },
      include: { roles: { include: { role: true } } },
    });

    return this.userMapper.toDomainList(users);
  }
}

/**
 * Prisma Client Type (dynamic)
 */
interface PrismaClientType {
  user: {
    findUnique: (args: unknown) => Promise<PrismaUser | null>;
    findFirst: (args: unknown) => Promise<PrismaUser | null>;
    findMany: (args: unknown) => Promise<PrismaUser[]>;
    count: (args: unknown) => Promise<number>;
    create: (args: unknown) => Promise<PrismaUser>;
    update: (args: unknown) => Promise<PrismaUser>;
    upsert: (args: unknown) => Promise<PrismaUser>;
    delete: (args: unknown) => Promise<PrismaUser>;
  };
  [key: string]: unknown;
}
