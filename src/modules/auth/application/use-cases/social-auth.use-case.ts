import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import {
  type ILogger,
  LOGGER,
  UNIT_OF_WORK,
  type IEventBus,
  EVENT_BUS,
} from '@core/domain/ports/services';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from '@modules/user/domain/repositories/user.repository.interface';
import { User } from '@modules/user/domain/entities/user.entity';
import { Email } from '@modules/user/domain/value-objects/email.value-object';
import { Password } from '@modules/user/domain/value-objects/password.value-object';
import { UserStatus } from '@modules/user/domain/enums/user-status.enum';
import { JwtService, type TokenPair } from '../../infrastructure/services/jwt.service';
import {
  type IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '@infrastructure/persistence/typeorm/repositories/refresh-token.repository';
import { generateUUID, generateToken } from '@shared/utils';

/**
 * Social Provider Type
 */
export type SocialProvider = 'google' | 'facebook' | 'apple';

/**
 * Social Auth Input
 */
export interface SocialAuthInput {
  provider: SocialProvider;
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  emailVerified?: boolean;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Social Auth Output
 */
export interface SocialAuthOutput extends TokenPair {
  isNewUser: boolean;
}

/**
 * Invalid Social Profile Error
 */
export class InvalidSocialProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSocialProfileError';
  }
}

/**
 * Social Auth Failed Error
 */
export class SocialAuthFailedError extends Error {
  constructor(provider: string) {
    super(`Failed to authenticate with ${provider}`);
    this.name = 'SocialAuthFailedError';
  }
}

/**
 * Account Inactive Error
 */
export class AccountInactiveForSocialError extends Error {
  constructor() {
    super('Your account is not active. Please contact support.');
    this.name = 'AccountInactiveForSocialError';
  }
}

/**
 * Social Auth Use Case
 *
 * Handles social login/registration.
 */
@Injectable()
export class SocialAuthUseCase extends BaseUseCase<SocialAuthInput, SocialAuthOutput> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: SocialAuthInput,
    context?: UseCaseContext,
  ): Promise<Result<SocialAuthOutput>> {
    try {
      const tenantId = context?.tenantId || 'default';

      // Validate email
      if (!input.email) {
        return Result.fail(new InvalidSocialProfileError('Email is required'));
      }

      let email: Email;
      try {
        email = Email.create(input.email);
      } catch (e) {
        return Result.fail(new InvalidSocialProfileError((e as Error).message));
      }

      let user = await this.userRepository.findByEmail(email.value, tenantId);
      let isNewUser = false;

      if (!user) {
        // Create new user
        isNewUser = true;
        const userId = generateUUID();

        // Generate a random password (user won't use it for social login)
        const randomPassword = `${generateToken(32)}Aa1!`;
        const password = await Password.create(randomPassword);

        user = User.create(userId, {
          email,
          password,
          firstName: input.firstName || 'User',
          lastName: input.lastName || '',
          status: UserStatus.ACTIVE,
          tenantId,
          roleIds: [],
          emailVerified: input.emailVerified ?? true,
        });

        await this.userRepository.save(user);
      } else {
        // Update last login
        user.recordLogin();
        await this.userRepository.save(user);
      }

      // Check if user is active
      if (!user.isActive) {
        return Result.fail(new AccountInactiveForSocialError());
      }

      // Generate tokens
      const tokenPair = this.jwtService.generateTokenPair({
        userId: user.id,
        tenantId: user.tenantId,
        roles: user.roleIds,
        permissions: [],
      });

      // Store refresh token
      await this.refreshTokenRepository.create({
        userId: user.id,
        token: tokenPair.refreshToken,
        familyId: generateUUID(),
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        expiresAt: this.jwtService.getRefreshTokenExpiryDate(),
      });

      // Publish domain events
      await this.eventBus.publishAll([...user.domainEvents]);
      user.clearDomainEvents();

      return Result.ok({
        ...tokenPair,
        isNewUser,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
