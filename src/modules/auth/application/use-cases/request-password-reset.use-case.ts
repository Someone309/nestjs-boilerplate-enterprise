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
 * Request Password Reset Input
 */
export interface RequestPasswordResetInput {
  email: string;
}

/**
 * Request Password Reset Output
 */
export interface RequestPasswordResetOutput {
  sent: boolean;
  message: string;
}

/**
 * Request Password Reset Use Case
 *
 * Sends password reset email to user.
 */
@Injectable()
export class RequestPasswordResetUseCase extends BaseUseCase<
  RequestPasswordResetInput,
  RequestPasswordResetOutput
> {
  private readonly resetTokenPrefix = 'password_reset:';
  private readonly resetTokenTTL: number;
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
    const expiresIn = this.configService.get<string>('auth.passwordResetExpiresIn') || '1h';
    this.resetTokenTTL = this.parseExpiration(expiresIn);
  }

  protected async executeImpl(
    input: RequestPasswordResetInput,
    context?: UseCaseContext,
  ): Promise<Result<RequestPasswordResetOutput>> {
    try {
      const tenantId = context?.tenantId || 'default';
      const successMessage =
        'If an account exists with that email, a password reset link has been sent';

      // Validate email format
      let email: Email;
      try {
        email = Email.create(input.email);
      } catch {
        return Result.ok({
          sent: true,
          message: successMessage,
        });
      }

      // Find user
      const user = await this.userRepository.findByEmail(email.value, tenantId);

      // Return success even if user not found (security)
      if (!user) {
        return Result.ok({
          sent: true,
          message: successMessage,
        });
      }

      // Generate reset token
      const resetToken = generateToken(32);
      await this.cache.set(`${this.resetTokenPrefix}${resetToken}`, user.id, {
        ttl: this.resetTokenTTL,
      });

      // Send password reset email
      await this.emailService.sendPasswordResetEmail(input.email, resetToken, user.firstName);

      return Result.ok({
        sent: true,
        message: successMessage,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private parseExpiration(expiration: string): number {
    const match = this.expirationRegex.exec(expiration);
    if (!match) {
      return 3600;
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
        return 3600;
    }
  }
}
