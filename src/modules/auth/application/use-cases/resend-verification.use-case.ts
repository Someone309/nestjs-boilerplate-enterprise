import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
import { type IEmailService, EMAIL_SERVICE } from '@core/domain/ports/services/email.interface';
import { type ICache, CACHE } from '@core/domain/ports/services/cache.interface';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from '@modules/user/domain/repositories/user.repository.interface';
import { Email } from '@modules/user/domain/value-objects/email.value-object';
import { generateToken } from '@shared/utils';

/**
 * Resend Verification Input
 */
export interface ResendVerificationInput {
  email: string;
}

/**
 * Resend Verification Output
 */
export interface ResendVerificationOutput {
  sent: boolean;
  message: string;
}

/**
 * Already Verified Error
 */
export class AlreadyVerifiedForResendError extends Error {
  constructor() {
    super('Email is already verified');
    this.name = 'AlreadyVerifiedForResendError';
  }
}

/**
 * Resend Verification Use Case
 *
 * Resends email verification to user.
 */
@Injectable()
export class ResendVerificationUseCase extends BaseUseCase<
  ResendVerificationInput,
  ResendVerificationOutput
> {
  private readonly verificationTokenPrefix = 'email_verification:';
  private readonly verificationTokenTTL: number;
  private readonly expirationRegex = /^(\d+)([smhd])$/;

  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
    @Inject(CACHE) private readonly cache: ICache,
    private readonly configService: ConfigService,
  ) {
    super(logger, unitOfWork);
    const expiresIn = this.configService.get<string>('auth.emailVerificationExpiresIn') || '24h';
    this.verificationTokenTTL = this.parseExpiration(expiresIn);
  }

  protected async executeImpl(
    input: ResendVerificationInput,
    context?: UseCaseContext,
  ): Promise<Result<ResendVerificationOutput>> {
    try {
      const tenantId = context?.tenantId || 'default';

      // Validate email format
      let email: Email;
      try {
        email = Email.create(input.email);
      } catch {
        // Return success for security (don't reveal if email exists)
        return Result.ok({
          sent: true,
          message: 'If an account exists with that email, a verification email has been sent',
        });
      }

      // Find user
      const user = await this.userRepository.findByEmail(email.value, tenantId);

      // Return success even if user not found (security)
      if (!user) {
        return Result.ok({
          sent: true,
          message: 'If an account exists with that email, a verification email has been sent',
        });
      }

      // Check if already verified
      if (user.emailVerified) {
        return Result.fail(new AlreadyVerifiedForResendError());
      }

      // Generate new verification token
      const verificationToken = generateToken(32);
      await this.cache.set(`${this.verificationTokenPrefix}${verificationToken}`, user.id, {
        ttl: this.verificationTokenTTL,
      });

      // Send verification email
      await this.emailService.sendVerificationEmail(input.email, verificationToken, user.firstName);

      return Result.ok({
        sent: true,
        message: 'Verification email sent successfully',
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private parseExpiration(expiration: string): number {
    const match = this.expirationRegex.exec(expiration);
    if (!match) {
      return 86400;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 86400;
    }
  }
}
