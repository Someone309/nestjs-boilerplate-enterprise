import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
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
 * Change Password Input
 */
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  revokeAllSessions?: boolean;
}

/**
 * Change Password Output
 */
export interface ChangePasswordOutput {
  success: boolean;
  message: string;
  sessionsRevoked: boolean;
}

/**
 * Change Password Errors
 */
export class InvalidCurrentPasswordError extends Error {
  constructor() {
    super('Current password is incorrect');
    this.name = 'InvalidCurrentPasswordError';
  }
}

export class PasswordSameAsCurrentError extends Error {
  constructor() {
    super('New password must be different from current password');
    this.name = 'PasswordSameAsCurrentError';
  }
}

/**
 * Change Password Use Case
 *
 * Allows authenticated users to change their password.
 *
 * Section 7.4: Security - Password Management
 */
@Injectable()
export class ChangePasswordUseCase extends BaseUseCase<ChangePasswordInput, ChangePasswordOutput> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: ChangePasswordInput,
    context?: UseCaseContext,
  ): Promise<Result<ChangePasswordOutput>> {
    try {
      const userId = context?.userId;
      if (!userId) {
        return Result.fail(new Error('User ID is required'));
      }

      // Find the user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return Result.fail(new Error('User not found'));
      }

      // Verify current password
      const isCurrentPasswordValid = await user.password.verifyAsync(input.currentPassword);
      if (!isCurrentPasswordValid) {
        return Result.fail(new InvalidCurrentPasswordError());
      }

      // Check if new password is the same as current
      const isSamePassword = await user.password.verifyAsync(input.newPassword);
      if (isSamePassword) {
        return Result.fail(new PasswordSameAsCurrentError());
      }

      // Create new password (this validates the password requirements)
      const newPassword = await Password.create(input.newPassword);

      // Update user password
      user.changePassword(newPassword);
      await this.userRepository.save(user);

      // Optionally revoke all sessions
      let sessionsRevoked = false;
      if (input.revokeAllSessions) {
        await this.refreshTokenRepository.revokeAllUserTokens(userId);
        sessionsRevoked = true;
        this.logger.log(`All sessions revoked for user: ${userId}`, 'ChangePasswordUseCase');
      }

      this.logger.log(`Password changed for user: ${userId}`, 'ChangePasswordUseCase');

      return Result.ok({
        success: true,
        message: 'Password changed successfully',
        sessionsRevoked,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
