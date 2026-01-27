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
import { type ICache, CACHE } from '@core/domain/ports/services/cache.interface';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from '@modules/user/domain/repositories/user.repository.interface';
import { Password } from '@modules/user/domain/value-objects/password.value-object';
import {
  type IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '@infrastructure/persistence/typeorm/repositories/refresh-token.repository';

/**
 * Reset Password Input
 */
export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

/**
 * Reset Password Output
 */
export interface ResetPasswordOutput {
  success: boolean;
  message: string;
}

/**
 * Invalid Reset Token Error
 */
export class InvalidResetTokenError extends Error {
  constructor() {
    super('Invalid or expired password reset token');
    this.name = 'InvalidResetTokenError';
  }
}

/**
 * User Not Found For Reset Error
 */
export class UserNotFoundForResetError extends Error {
  constructor() {
    super('User not found');
    this.name = 'UserNotFoundForResetError';
  }
}

/**
 * Invalid New Password Error
 */
export class InvalidNewPasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNewPasswordError';
  }
}

/**
 * Reset Password Use Case
 *
 * Resets user password using reset token.
 */
@Injectable()
export class ResetPasswordUseCase extends BaseUseCase<ResetPasswordInput, ResetPasswordOutput> {
  private readonly resetTokenPrefix = 'password_reset:';

  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
    @Inject(CACHE) private readonly cache: ICache,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: ResetPasswordInput,
    _context?: UseCaseContext,
  ): Promise<Result<ResetPasswordOutput>> {
    try {
      // Get user ID from token
      const userId = await this.cache.get<string>(`${this.resetTokenPrefix}${input.token}`);

      if (!userId) {
        return Result.fail(new InvalidResetTokenError());
      }

      // Find user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return Result.fail(new UserNotFoundForResetError());
      }

      // Validate new password
      let password: Password;
      try {
        password = await Password.create(input.newPassword);
      } catch (e) {
        return Result.fail(new InvalidNewPasswordError((e as Error).message));
      }

      // Update password
      user.changePassword(password);

      // Save user
      await this.userRepository.save(user);

      // Delete reset token
      await this.cache.delete(`${this.resetTokenPrefix}${input.token}`);

      // Revoke all refresh tokens for security
      await this.refreshTokenRepository.revokeAllUserTokens(userId);

      // Publish domain events
      await this.eventBus.publishAll([...user.domainEvents]);
      user.clearDomainEvents();

      return Result.ok({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
