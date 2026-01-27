import { Injectable, Inject } from '@nestjs/common';
import { PRISMA_CLIENT } from '../prisma.module';
import type {
  IRefreshTokenRepository,
  CreateRefreshTokenData,
} from '../../typeorm/repositories/refresh-token.repository';

/**
 * Prisma Refresh Token Type
 */
interface PrismaRefreshToken {
  id: string;
  token: string;
  userId: string;
  familyId?: string | null;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId?: string | null;
  createdAt: Date;
}

/**
 * Refresh Token Entity for responses
 * Matches the structure expected by IRefreshTokenRepository
 */
interface RefreshTokenEntity {
  id: string;
  userId: string;
  token: string;
  familyId: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
  deviceId?: string;
  revokedAt?: Date;
  replacedByTokenId?: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  isValid: boolean;
  isExpired: boolean;
  isRevoked: boolean;
}

/**
 * Prisma Refresh Token Repository Implementation
 *
 * Handles refresh token persistence for JWT authentication using Prisma.
 *
 * Section 12.5: JWT Security Best Practices
 * Section 8.6: Database Switching Guide - Prisma implementation
 */
@Injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClientType,
  ) {}

  private toEntity(prismaModel: PrismaRefreshToken): RefreshTokenEntity {
    const now = new Date();
    const isExpired = prismaModel.expiresAt <= now;
    const isRevoked = !!prismaModel.revokedAt;
    return {
      id: prismaModel.id,
      userId: prismaModel.userId,
      token: prismaModel.token,
      familyId: prismaModel.familyId || '',
      expiresAt: prismaModel.expiresAt,
      userAgent: prismaModel.deviceInfo || undefined,
      ipAddress: prismaModel.ipAddress || undefined,
      revokedAt: prismaModel.revokedAt || undefined,
      replacedByTokenId: prismaModel.replacedByTokenId || undefined,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.createdAt,
      version: 1,
      isValid: !isExpired && !isRevoked,
      isExpired,
      isRevoked,
    };
  }

  async create(data: CreateRefreshTokenData): Promise<RefreshTokenEntity> {
    const created = await this.prisma.refreshToken.create({
      data: {
        userId: data.userId,
        token: data.token,
        familyId: data.familyId,
        expiresAt: data.expiresAt,
        deviceInfo: data.userAgent,
        ipAddress: data.ipAddress,
      },
    });

    return this.toEntity(created);
  }

  async findByToken(token: string): Promise<RefreshTokenEntity | null> {
    const found = await this.prisma.refreshToken.findFirst({
      where: { token },
    });

    return found ? this.toEntity(found) : null;
  }

  async findByUserId(userId: string): Promise<RefreshTokenEntity[]> {
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return tokens.map((t) => this.toEntity(t));
  }

  async revokeToken(id: string, replacedByTokenId?: string): Promise<void> {
    const updateData: Record<string, unknown> = {
      revokedAt: new Date(),
    };

    if (replacedByTokenId) {
      updateData.replacedByTokenId = replacedByTokenId;
    }

    await this.prisma.refreshToken.update({
      where: { id },
      data: updateData,
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async revokeTokenFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        familyId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async deleteExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count ?? 0;
  }

  async isTokenValid(token: string): Promise<boolean> {
    const entity = await this.findByToken(token);
    return entity ? entity.isValid : false;
  }
}

/**
 * Prisma Client Type (dynamic)
 */
interface PrismaClientType {
  refreshToken: {
    findFirst: (args: unknown) => Promise<PrismaRefreshToken | null>;
    findMany: (args: unknown) => Promise<PrismaRefreshToken[]>;
    create: (args: unknown) => Promise<PrismaRefreshToken>;
    update: (args: unknown) => Promise<PrismaRefreshToken>;
    updateMany: (args: unknown) => Promise<{ count: number }>;
    deleteMany: (args: unknown) => Promise<{ count: number }>;
  };
  [key: string]: unknown;
}
