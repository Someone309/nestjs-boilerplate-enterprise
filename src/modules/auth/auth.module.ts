import { Module, Global, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { RoleModule } from '@modules/role/role.module';
import { AuthController } from './presentation/controllers/auth.controller';
import {
  SocialAuthController,
  SocialAuthApiController,
} from './presentation/controllers/social-auth.controller';
import { JwtService } from './infrastructure/services/jwt.service';
import { TokenBlacklistService } from './infrastructure/services/token-blacklist.service';
import { GoogleStrategy } from './infrastructure/strategies/google.strategy';
import { FacebookStrategy } from './infrastructure/strategies/facebook.strategy';
import { ApplePassportStrategy } from './infrastructure/strategies/apple.strategy';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { ResendVerificationUseCase } from './application/use-cases/resend-verification.use-case';
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { SocialAuthUseCase } from './application/use-cases/social-auth.use-case';

/**
 * Auth Module
 *
 * Provides authentication functionality.
 * Repositories are provided by the database module (TypeORM/Mongoose/Prisma).
 *
 * Features:
 * - Email/password login
 * - User registration with email verification
 * - Password reset flow
 * - Social login (Google, Facebook, Apple)
 * - JWT token management
 * - Refresh token rotation
 *
 * Section 7.4: Security - Authentication
 * Section 8.6: Database Switching Guide
 * Section 12.5: JWT Security Best Practices
 */
@Global()
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), forwardRef(() => RoleModule)],
  controllers: [AuthController, SocialAuthController, SocialAuthApiController],
  providers: [
    // Services
    JwtService,
    TokenBlacklistService,

    // OAuth Strategies (conditionally provided)
    {
      provide: GoogleStrategy,
      useFactory: (configService: ConfigService) => {
        if (configService.get<boolean>('auth.google.enabled')) {
          return new GoogleStrategy(configService);
        }
        return null;
      },
      inject: [ConfigService],
    },
    {
      provide: FacebookStrategy,
      useFactory: (configService: ConfigService) => {
        if (configService.get<boolean>('auth.facebook.enabled')) {
          return new FacebookStrategy(configService);
        }
        return null;
      },
      inject: [ConfigService],
    },
    {
      provide: ApplePassportStrategy,
      useFactory: (configService: ConfigService) => {
        if (configService.get<boolean>('auth.apple.enabled')) {
          return new ApplePassportStrategy(configService);
        }
        return null;
      },
      inject: [ConfigService],
    },

    // Use Cases
    LoginUseCase,
    LogoutUseCase,
    RefreshTokenUseCase,
    ChangePasswordUseCase,
    RegisterUseCase,
    VerifyEmailUseCase,
    ResendVerificationUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    SocialAuthUseCase,
  ],
  exports: [JwtService, TokenBlacklistService],
})
export class AuthModule {}
