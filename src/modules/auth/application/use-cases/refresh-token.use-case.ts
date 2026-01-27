import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from '@modules/user/domain/repositories/user.repository.interface';
import {
  type IRoleRepository,
  ROLE_REPOSITORY,
} from '@modules/role/domain/repositories/role.repository.interface';
import { UserStatus } from '@modules/user/domain/enums/user-status.enum';
import { JwtService, type TokenPair } from '../../infrastructure/services/jwt.service';
import {
  type IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '@infrastructure/persistence/typeorm/repositories/refresh-token.repository';

/**
 * Refresh Token Input
 */
export interface RefreshTokenInput {
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Refresh Token Output
 */
export type RefreshTokenOutput = TokenPair;

/**
 * Token Errors
 */
export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('Invalid or expired refresh token');
    this.name = 'InvalidRefreshTokenError';
  }
}

export class TokenReuseDetectedError extends Error {
  constructor() {
    super('Token reuse detected - all sessions revoked for security');
    this.name = 'TokenReuseDetectedError';
  }
}

/**
 * Refresh Token Use Case
 *
 * Refreshes access token using refresh token with rotation.
 *
 * Section 12.5: Refresh Token Strategy
 * - Single-use refresh tokens (rotation)
 * - Family tracking for theft detection
 */
@Injectable()
export class RefreshTokenUseCase extends BaseUseCase<RefreshTokenInput, RefreshTokenOutput> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: IRoleRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) {
    super(logger, unitOfWork);
  }

  /**
   * Load permissions from user's roles
   */
  private async loadPermissionsFromRoles(roleIds: readonly string[]): Promise<string[]> {
    if (roleIds.length === 0) {
      return [];
    }

    const roles = await this.roleRepository.findByIds([...roleIds]);
    const permissionSet = new Set<string>();

    for (const role of roles) {
      for (const permission of role.permissions) {
        permissionSet.add(permission);
      }
    }

    return Array.from(permissionSet);
  }

  protected async executeImpl(
    input: RefreshTokenInput,
    _context?: UseCaseContext,
  ): Promise<Result<RefreshTokenOutput>> {
    try {
      // Find the refresh token
      const tokenEntity = await this.refreshTokenRepository.findByToken(input.refreshToken);

      if (!tokenEntity) {
        return Result.fail(new InvalidRefreshTokenError());
      }

      // Check if token has been revoked (potential reuse attack)
      if (tokenEntity.isRevoked) {
        // Token was already used - this is a potential theft attempt
        // Revoke the entire token family for security
        this.logger.warn(
          `Token reuse detected for family: ${tokenEntity.familyId}`,
          'RefreshTokenUseCase',
        );
        await this.refreshTokenRepository.revokeTokenFamily(tokenEntity.familyId);
        return Result.fail(new TokenReuseDetectedError());
      }

      // Check if token is expired
      if (tokenEntity.isExpired) {
        return Result.fail(new InvalidRefreshTokenError());
      }

      // Find the user
      const user = await this.userRepository.findById(tokenEntity.userId);
      if (user?.status !== UserStatus.ACTIVE) {
        await this.refreshTokenRepository.revokeToken(tokenEntity.id);
        return Result.fail(new InvalidRefreshTokenError());
      }

      // Load permissions from user's roles
      const permissions = await this.loadPermissionsFromRoles(user.roleIds);

      // Generate new token pair
      const newTokens = this.jwtService.generateTokenPair({
        userId: user.id,
        tenantId: user.tenantId,
        roles: user.roleIds,
        permissions,
      });

      // Create new refresh token (rotation)
      const newRefreshTokenEntity = await this.refreshTokenRepository.create({
        userId: user.id,
        token: newTokens.refreshToken,
        familyId: tokenEntity.familyId, // Same family for rotation tracking
        expiresAt: this.jwtService.getRefreshTokenExpiryDate(),
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
      });

      // Revoke the old refresh token, link to new one
      await this.refreshTokenRepository.revokeToken(tokenEntity.id, newRefreshTokenEntity.id);

      return Result.ok(newTokens);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
