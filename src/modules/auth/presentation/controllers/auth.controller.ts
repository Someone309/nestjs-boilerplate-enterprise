import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public, Auth, CurrentUser, ApiStandardResponses } from '@shared/decorators';
import type { JwtPayload } from '../../infrastructure/services/jwt.service';
import { LoginDto, LoginResponseDto } from '../dtos/login.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { ChangePasswordDto, ChangePasswordResponseDto } from '../dtos/change-password.dto';
import { RegisterDto, RegisterResponseDto } from '../dtos/register.dto';
import {
  VerifyEmailDto,
  VerifyEmailResponseDto,
  ResendVerificationDto,
  ResendVerificationResponseDto,
} from '../dtos/email-verification.dto';
import {
  RequestPasswordResetDto,
  RequestPasswordResetResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
} from '../dtos/password-reset.dto';
import {
  LoginUseCase,
  InvalidCredentialsError,
  AccountLockedError,
  AccountInactiveError,
} from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import {
  RefreshTokenUseCase,
  InvalidRefreshTokenError,
  TokenReuseDetectedError,
} from '../../application/use-cases/refresh-token.use-case';
import {
  ChangePasswordUseCase,
  InvalidCurrentPasswordError,
  PasswordSameAsCurrentError,
} from '../../application/use-cases/change-password.use-case';
import {
  RegisterUseCase,
  EmailAlreadyExistsError,
  InvalidEmailError,
  InvalidPasswordError,
} from '../../application/use-cases/register.use-case';
import {
  VerifyEmailUseCase,
  InvalidVerificationTokenError,
  EmailAlreadyVerifiedError,
} from '../../application/use-cases/verify-email.use-case';
import {
  ResendVerificationUseCase,
  AlreadyVerifiedForResendError,
} from '../../application/use-cases/resend-verification.use-case';
import { RequestPasswordResetUseCase } from '../../application/use-cases/request-password-reset.use-case';
import {
  ResetPasswordUseCase,
  InvalidResetTokenError,
  InvalidNewPasswordError,
} from '../../application/use-cases/reset-password.use-case';

/**
 * Auth Controller
 *
 * Handles authentication HTTP endpoints.
 *
 * Section 7.4: Security - Authentication
 * Section 12.5: JWT Security Best Practices
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly resendVerificationUseCase: ResendVerificationUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  /**
   * Register
   * POST /auth/register
   */
  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiStandardResponses()
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
  ): Promise<{ data: RegisterResponseDto }> {
    const tenantId = dto.tenantId || this.extractTenantId(req);

    const result = await this.registerUseCase.execute(
      {
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      { tenantId },
    );

    if (!result.success) {
      if (result.error instanceof EmailAlreadyExistsError) {
        throw new ConflictException(result.error.message);
      }
      if (result.error instanceof InvalidEmailError) {
        throw new BadRequestException(result.error.message);
      }
      if (result.error instanceof InvalidPasswordError) {
        throw new BadRequestException(result.error.message);
      }
      throw result.error;
    }

    return {
      data: {
        userId: result.value.userId,
        email: result.value.email,
        message: result.value.message,
      },
    };
  }

  /**
   * Verify Email
   * POST /auth/verify-email
   */
  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user email address' })
  @ApiStandardResponses()
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ data: VerifyEmailResponseDto }> {
    const result = await this.verifyEmailUseCase.execute({
      token: dto.token,
    });

    if (!result.success) {
      if (result.error instanceof InvalidVerificationTokenError) {
        throw new BadRequestException(result.error.message);
      }
      if (result.error instanceof EmailAlreadyVerifiedError) {
        throw new BadRequestException(result.error.message);
      }
      throw result.error;
    }

    return {
      data: {
        verified: result.value.verified,
        message: result.value.message,
      },
    };
  }

  /**
   * Resend Verification Email
   * POST /auth/resend-verification
   */
  @Post('resend-verification')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification' })
  @ApiStandardResponses()
  async resendVerification(
    @Body() dto: ResendVerificationDto,
    @Req() req: Request,
  ): Promise<{ data: ResendVerificationResponseDto }> {
    const tenantId = this.extractTenantId(req);

    const result = await this.resendVerificationUseCase.execute({ email: dto.email }, { tenantId });

    if (!result.success) {
      if (result.error instanceof AlreadyVerifiedForResendError) {
        throw new BadRequestException(result.error.message);
      }
      throw result.error;
    }

    return {
      data: {
        sent: result.value.sent,
        message: result.value.message,
      },
    };
  }

  /**
   * Request Password Reset
   * POST /auth/forgot-password
   */
  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiStandardResponses()
  async forgotPassword(
    @Body() dto: RequestPasswordResetDto,
    @Req() req: Request,
  ): Promise<{ data: RequestPasswordResetResponseDto }> {
    const tenantId = this.extractTenantId(req);

    const result = await this.requestPasswordResetUseCase.execute(
      { email: dto.email },
      { tenantId },
    );

    if (!result.success) {
      throw result.error;
    }

    return {
      data: {
        sent: result.value.sent,
        message: result.value.message,
      },
    };
  }

  /**
   * Reset Password
   * POST /auth/reset-password
   */
  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiStandardResponses()
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ data: ResetPasswordResponseDto }> {
    const result = await this.resetPasswordUseCase.execute({
      token: dto.token,
      newPassword: dto.newPassword,
    });

    if (!result.success) {
      if (result.error instanceof InvalidResetTokenError) {
        throw new BadRequestException(result.error.message);
      }
      if (result.error instanceof InvalidNewPasswordError) {
        throw new BadRequestException(result.error.message);
      }
      throw result.error;
    }

    return {
      data: {
        success: result.value.success,
        message: result.value.message,
      },
    };
  }

  /**
   * Login
   * POST /auth/login
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and get tokens' })
  @ApiStandardResponses()
  async login(@Body() dto: LoginDto, @Req() req: Request): Promise<{ data: LoginResponseDto }> {
    // Get tenant from header or subdomain
    const tenantId = this.extractTenantId(req);

    const result = await this.loginUseCase.execute(
      {
        email: dto.email,
        password: dto.password,
        userAgent: req.headers['user-agent'],
        ipAddress: this.getClientIp(req),
      },
      {
        tenantId,
      },
    );

    if (!result.success) {
      if (result.error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException('Invalid email or password');
      }
      if (result.error instanceof AccountLockedError) {
        throw new ForbiddenException('Account is temporarily locked');
      }
      if (result.error instanceof AccountInactiveError) {
        throw new ForbiddenException(result.error.message);
      }
      throw result.error;
    }

    return {
      data: {
        accessToken: result.value.accessToken,
        refreshToken: result.value.refreshToken,
        expiresIn: result.value.expiresIn,
        tokenType: result.value.tokenType,
      },
    };
  }

  /**
   * Refresh Token
   * POST /auth/refresh
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiStandardResponses()
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
  ): Promise<{ data: LoginResponseDto }> {
    const result = await this.refreshTokenUseCase.execute({
      refreshToken: dto.refreshToken,
      userAgent: req.headers['user-agent'],
      ipAddress: this.getClientIp(req),
    });

    if (!result.success) {
      if (
        result.error instanceof InvalidRefreshTokenError ||
        result.error instanceof TokenReuseDetectedError
      ) {
        throw new UnauthorizedException(result.error.message);
      }
      throw result.error;
    }

    return {
      data: {
        accessToken: result.value.accessToken,
        refreshToken: result.value.refreshToken,
        expiresIn: result.value.expiresIn,
        tokenType: result.value.tokenType,
      },
    };
  }

  /**
   * Logout
   * POST /auth/logout
   */
  @Post('logout')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate tokens' })
  @ApiStandardResponses()
  async logout(
    @CurrentUser() user: JwtPayload,
    @Body() body: { refreshToken?: string; logoutAll?: boolean },
    @Req() req: Request,
  ): Promise<{ data: { message: string } }> {
    const accessToken = this.extractAccessToken(req);

    const result = await this.logoutUseCase.execute(
      {
        accessToken: accessToken || '',
        refreshToken: body.refreshToken,
        logoutAll: body.logoutAll,
      },
      {
        userId: user.sub,
        tenantId: user.tenantId,
      },
    );

    if (!result.success) {
      throw result.error;
    }

    return {
      data: {
        message: result.value.message,
      },
    };
  }

  /**
   * Get current user
   * GET /auth/me
   */
  @Get('me')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current authenticated user info' })
  @ApiStandardResponses()
  me(@CurrentUser() user: JwtPayload): { data: JwtPayload } {
    return { data: user };
  }

  /**
   * Change password
   * POST /auth/change-password
   */
  @Post('change-password')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  @ApiStandardResponses()
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ data: ChangePasswordResponseDto }> {
    const result = await this.changePasswordUseCase.executeInTransaction(
      {
        currentPassword: dto.currentPassword,
        newPassword: dto.newPassword,
        revokeAllSessions: dto.revokeAllSessions,
      },
      {
        userId: user.sub,
        tenantId: user.tenantId,
      },
    );

    if (!result.success) {
      if (result.error instanceof InvalidCurrentPasswordError) {
        throw new UnauthorizedException(result.error.message);
      }
      if (result.error instanceof PasswordSameAsCurrentError) {
        throw new ForbiddenException(result.error.message);
      }
      throw result.error;
    }

    return {
      data: {
        success: result.value.success,
        message: result.value.message,
        sessionsRevoked: result.value.sessionsRevoked,
      },
    };
  }

  /**
   * Extract tenant ID from request
   */
  private extractTenantId(req: Request): string {
    // Try from header first
    const headerTenantId = req.headers['x-tenant-id'];
    if (headerTenantId && typeof headerTenantId === 'string') {
      return headerTenantId;
    }

    // Try from subdomain
    const host = req.hostname || req.headers.host;
    if (host) {
      // Skip localhost/IP addresses - they don't have valid subdomains
      const isLocalhost =
        host === 'localhost' ||
        host.startsWith('127.') ||
        host.startsWith('192.168.') ||
        host.startsWith('10.') ||
        /^\d+\.\d+\.\d+\.\d+(:\d+)?$/.test(host);

      if (!isLocalhost) {
        const subdomain = host.split('.')[0];
        if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
          // In production, look up tenant by subdomain
          // For now, use subdomain as tenant ID
          return subdomain;
        }
      }
    }

    // Default tenant (for development) - nil UUID
    return '00000000-0000-0000-0000-000000000000';
  }

  /**
   * Get client IP address
   */
  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
      return ips.trim();
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }

  /**
   * Extract access token from Authorization header
   */
  private extractAccessToken(req: Request): string | null {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return null;
    }

    const [type, token] = authorization.split(' ');
    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
