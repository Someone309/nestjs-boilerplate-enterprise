import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import {
  type ILogger,
  LOGGER,
  UNIT_OF_WORK,
  type IEventBus,
  EVENT_BUS,
} from '@core/domain/ports/services';
import { type IEmailService, EMAIL_SERVICE } from '@core/domain/ports/services/email.interface';
import { type ICache, CACHE } from '@core/domain/ports/services/cache.interface';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from '@modules/user/domain/repositories/user.repository.interface';
import { User } from '@modules/user/domain/entities/user.entity';
import { Email } from '@modules/user/domain/value-objects/email.value-object';
import { Password } from '@modules/user/domain/value-objects/password.value-object';
import { UserStatus } from '@modules/user/domain/enums/user-status.enum';
import { generateUUID, generateToken } from '@shared/utils';

/**
 * Register Command Input
 */
export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Register Command Output
 */
export interface RegisterOutput {
  userId: string;
  email: string;
  message: string;
}

/**
 * Email Already Exists Error
 */
export class EmailAlreadyExistsError extends Error {
  constructor() {
    super('An account with this email already exists');
    this.name = 'EmailAlreadyExistsError';
  }
}

/**
 * Invalid Email Error
 */
export class InvalidEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmailError';
  }
}

/**
 * Invalid Password Error
 */
export class InvalidPasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPasswordError';
  }
}

/**
 * Register Use Case
 *
 * Handles user registration with email verification.
 */
@Injectable()
export class RegisterUseCase extends BaseUseCase<RegisterInput, RegisterOutput> {
  private readonly verificationTokenPrefix = 'email_verification:';
  private readonly verificationTokenTTL: number;
  private readonly expirationRegex = /^(\d+)([smhd])$/;

  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
    @Inject(CACHE) private readonly cache: ICache,
    private readonly configService: ConfigService,
  ) {
    super(logger, unitOfWork);
    const expiresIn = this.configService.get<string>('auth.emailVerificationExpiresIn') || '24h';
    this.verificationTokenTTL = this.parseExpiration(expiresIn);
  }

  protected async executeImpl(
    input: RegisterInput,
    context?: UseCaseContext,
  ): Promise<Result<RegisterOutput>> {
    try {
      const tenantId = context?.tenantId || 'default';

      // Validate email format
      let email: Email;
      try {
        email = Email.create(input.email);
      } catch (e) {
        return Result.fail(new InvalidEmailError((e as Error).message));
      }

      // Validate password
      let password: Password;
      try {
        password = await Password.create(input.password);
      } catch (e) {
        return Result.fail(new InvalidPasswordError((e as Error).message));
      }

      // Check if email already exists
      const existingUser = await this.userRepository.findByEmail(email.value, tenantId);
      if (existingUser) {
        return Result.fail(new EmailAlreadyExistsError());
      }

      // Create user
      const userId = generateUUID();
      const user = User.create(userId, {
        email,
        password,
        firstName: input.firstName,
        lastName: input.lastName,
        status: UserStatus.PENDING,
        tenantId,
        roleIds: [],
        emailVerified: false,
      });

      // Save user
      await this.userRepository.save(user);

      // Generate verification token
      const verificationToken = generateToken(32);
      await this.cache.set(`${this.verificationTokenPrefix}${verificationToken}`, userId, {
        ttl: this.verificationTokenTTL,
      });

      // Send verification email
      await this.emailService.sendVerificationEmail(
        input.email,
        verificationToken,
        input.firstName,
      );

      // Publish domain events
      await this.eventBus.publishAll([...user.domainEvents]);
      user.clearDomainEvents();

      return Result.ok({
        userId,
        email: input.email,
        message: 'Registration successful. Please check your email to verify your account.',
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
