import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
import { generateUUID } from '@shared/utils';
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
 * Login Input
 */
export interface LoginInput {
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Login Output
 */
export interface LoginOutput extends TokenPair {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: readonly string[];
  };
}

/**
 * Login Errors
 */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

export class AccountLockedError extends Error {
  constructor(public readonly lockedUntil: Date) {
    super('Account is temporarily locked');
    this.name = 'AccountLockedError';
  }
}

export class AccountInactiveError extends Error {
  constructor(public readonly status: string) {
    super(`Account is ${status}`);
    this.name = 'AccountInactiveError';
  }
}

/**
 * Login Use Case
 *
 * Authenticates user and generates JWT tokens.
 *
 * Section 12.5: JWT Security Best Practices
 */
@Injectable()
export class LoginUseCase extends BaseUseCase<LoginInput, LoginOutput> {
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
    input: LoginInput,
    context?: UseCaseContext,
  ): Promise<Result<LoginOutput>> {
    try {
      const tenantId = context?.tenantId;
      if (!tenantId) {
        return Result.fail(new Error('Tenant ID is required'));
      }

      // Find user by email
      const user = await this.userRepository.findByEmail(input.email, tenantId);
      if (!user) {
        return Result.fail(new InvalidCredentialsError());
      }

      // Check if account is locked
      // Note: This would need lockInfo property in User entity
      // For now, we skip this check

      // Check account status
      if (user.status !== UserStatus.ACTIVE) {
        if (user.status === UserStatus.PENDING) {
          return Result.fail(new AccountInactiveError('pending activation'));
        }
        if (user.status === UserStatus.SUSPENDED) {
          return Result.fail(new AccountInactiveError('suspended'));
        }
        if (user.status === UserStatus.DELETED) {
          return Result.fail(new InvalidCredentialsError());
        }
        return Result.fail(new AccountInactiveError(user.status));
      }

      // Verify password
      if (!user.password.verify(input.password)) {
        // Log failed login attempt for security monitoring
        this.logger.warn(
          `Failed login attempt for user: ${user.id} (${input.email}) from IP: ${input.ipAddress || 'unknown'}`,
          'LoginUseCase',
        );
        return Result.fail(new InvalidCredentialsError());
      }

      // Load permissions from user's roles
      const permissions = await this.loadPermissionsFromRoles(user.roleIds);

      // Generate token pair
      const tokens = this.jwtService.generateTokenPair({
        userId: user.id,
        tenantId: user.tenantId,
        roles: user.roleIds,
        permissions,
      });

      // Store refresh token
      const familyId = generateUUID();
      await this.refreshTokenRepository.create({
        userId: user.id,
        token: tokens.refreshToken,
        familyId,
        expiresAt: this.jwtService.getRefreshTokenExpiryDate(),
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
      });

      // Update last login time
      user.recordLogin();
      await this.userRepository.save(user);

      return Result.ok({
        ...tokens,
        user: {
          id: user.id,
          email: user.email.value,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roleIds,
        },
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
