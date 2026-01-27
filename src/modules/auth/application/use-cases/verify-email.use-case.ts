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
import { UserStatus } from '@modules/user/domain/enums/user-status.enum';

/**
 * Verify Email Input
 */
export interface VerifyEmailInput {
  token: string;
}

/**
 * Verify Email Output
 */
export interface VerifyEmailOutput {
  verified: boolean;
  message: string;
}

/**
 * Invalid Token Error
 */
export class InvalidVerificationTokenError extends Error {
  constructor() {
    super('Invalid or expired verification token');
    this.name = 'InvalidVerificationTokenError';
  }
}

/**
 * User Not Found Error
 */
export class UserNotFoundForVerificationError extends Error {
  constructor() {
    super('User not found');
    this.name = 'UserNotFoundForVerificationError';
  }
}

/**
 * Already Verified Error
 */
export class EmailAlreadyVerifiedError extends Error {
  constructor() {
    super('Email is already verified');
    this.name = 'EmailAlreadyVerifiedError';
  }
}

/**
 * Verify Email Use Case
 *
 * Verifies user email using verification token.
 */
@Injectable()
export class VerifyEmailUseCase extends BaseUseCase<VerifyEmailInput, VerifyEmailOutput> {
  private readonly verificationTokenPrefix = 'email_verification:';

  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
    @Inject(CACHE) private readonly cache: ICache,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: VerifyEmailInput,
    _context?: UseCaseContext,
  ): Promise<Result<VerifyEmailOutput>> {
    try {
      // Get user ID from token
      const userId = await this.cache.get<string>(`${this.verificationTokenPrefix}${input.token}`);

      if (!userId) {
        return Result.fail(new InvalidVerificationTokenError());
      }

      // Find user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return Result.fail(new UserNotFoundForVerificationError());
      }

      // Check if already verified
      if (user.emailVerified) {
        return Result.fail(new EmailAlreadyVerifiedError());
      }

      // Verify email
      user.verifyEmail();

      // Activate user if pending
      if (user.status === UserStatus.PENDING) {
        user.activate();
      }

      // Save user
      await this.userRepository.save(user);

      // Delete token
      await this.cache.delete(`${this.verificationTokenPrefix}${input.token}`);

      // Publish domain events
      await this.eventBus.publishAll([...user.domainEvents]);
      user.clearDomainEvents();

      return Result.ok({
        verified: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
