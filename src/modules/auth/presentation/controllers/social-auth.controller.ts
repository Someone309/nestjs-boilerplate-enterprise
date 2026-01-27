import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UseGuards,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public, ApiStandardResponses } from '@shared/decorators';
import {
  SocialAuthUseCase,
  type SocialProvider,
} from '../../application/use-cases/social-auth.use-case';
import type { GoogleProfile } from '../../infrastructure/strategies/google.strategy';
import type { FacebookProfile } from '../../infrastructure/strategies/facebook.strategy';
import type { AppleProfile } from '../../infrastructure/strategies';
import { AvailableProvidersResponseDto, SocialAuthResponseDto } from '../dtos/social-auth.dto';

/**
 * Social Auth Controller
 *
 * Handles OAuth2 social login endpoints.
 */
@ApiTags('Auth - Social')
@Controller('auth')
export class SocialAuthController {
  constructor(
    private readonly socialAuthUseCase: SocialAuthUseCase,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get available social providers
   * GET /auth/providers
   */
  @Get('providers')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get available social login providers' })
  @ApiStandardResponses()
  getProviders(): { data: AvailableProvidersResponseDto } {
    const providers = [];

    if (this.configService.get<boolean>('auth.google.enabled')) {
      providers.push({
        provider: 'google',
        enabled: true,
        authUrl: '/auth/google',
      });
    }

    if (this.configService.get<boolean>('auth.facebook.enabled')) {
      providers.push({
        provider: 'facebook',
        enabled: true,
        authUrl: '/auth/facebook',
      });
    }

    if (this.configService.get<boolean>('auth.apple.enabled')) {
      providers.push({
        provider: 'apple',
        enabled: true,
        authUrl: '/auth/apple',
      });
    }

    return {
      data: {
        providers,
      },
    };
  }

  /**
   * Google OAuth Login
   * GET /auth/google
   */
  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  googleLogin(): void {
    // Guard redirects to Google
  }

  /**
   * Google OAuth Callback
   * GET /auth/google/callback
   */
  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiExcludeEndpoint()
  async googleCallback(
    @Req() req: Request & { user?: GoogleProfile },
    @Res() res: Response,
  ): Promise<void> {
    await this.handleSocialCallback(req, res, 'google', req.user);
  }

  /**
   * Facebook OAuth Login
   * GET /auth/facebook
   */
  @Get('facebook')
  @Public()
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Initiate Facebook OAuth login' })
  facebookLogin(): void {
    // Guard redirects to Facebook
  }

  /**
   * Facebook OAuth Callback
   * GET /auth/facebook/callback
   */
  @Get('facebook/callback')
  @Public()
  @UseGuards(AuthGuard('facebook'))
  @ApiExcludeEndpoint()
  async facebookCallback(
    @Req() req: Request & { user?: FacebookProfile },
    @Res() res: Response,
  ): Promise<void> {
    await this.handleSocialCallback(req, res, 'facebook', req.user);
  }

  /**
   * Apple OAuth Login
   * GET /auth/apple
   */
  @Get('apple')
  @Public()
  @UseGuards(AuthGuard('apple'))
  @ApiOperation({ summary: 'Initiate Apple OAuth login' })
  appleLogin(): void {
    // Guard redirects to Apple
  }

  /**
   * Apple OAuth Callback
   * POST /auth/apple/callback (Apple uses POST)
   */
  @Get('apple/callback')
  @Public()
  @UseGuards(AuthGuard('apple'))
  @ApiExcludeEndpoint()
  async appleCallback(
    @Req() req: Request & { user?: AppleProfile },
    @Res() res: Response,
  ): Promise<void> {
    await this.handleSocialCallback(req, res, 'apple', req.user);
  }

  /**
   * Handle social auth callback
   */
  private async handleSocialCallback(
    req: Request,
    res: Response,
    provider: SocialProvider,
    profile?: GoogleProfile | FacebookProfile | AppleProfile,
  ): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('auth.frontendUrl') || 'http://localhost:3000';

    if (!profile) {
      res.redirect(`${frontendUrl}/auth/error?error=social_auth_failed&provider=${provider}`);
      return;
    }

    try {
      const result = await this.socialAuthUseCase.execute({
        provider,
        providerId: profile.id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        picture: 'picture' in profile ? profile.picture : undefined,
        emailVerified: 'emailVerified' in profile ? profile.emailVerified : true,
        userAgent: req.headers['user-agent'],
        ipAddress: this.getClientIp(req),
      });

      if (!result.success) {
        res.redirect(
          `${frontendUrl}/auth/error?error=${result.error.name}&message=${encodeURIComponent(result.error.message)}`,
        );
        return;
      }

      // Redirect with tokens
      const params = new URLSearchParams({
        accessToken: result.value.accessToken,
        refreshToken: result.value.refreshToken,
        expiresIn: result.value.expiresIn.toString(),
        isNewUser: result.value.isNewUser.toString(),
      });

      res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
    } catch {
      res.redirect(`${frontendUrl}/auth/error?error=social_auth_failed&provider=${provider}`);
    }
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
}

/**
 * Social Auth API Controller (for mobile/SPA apps)
 *
 * Provides JSON responses instead of redirects for mobile apps.
 */
@ApiTags('Auth - Social API')
@Controller('auth/api')
export class SocialAuthApiController {
  constructor(private readonly socialAuthUseCase: SocialAuthUseCase) {}

  /**
   * Google OAuth API Login
   * POST /auth/api/google
   *
   * Accepts Google ID token and returns JWT tokens.
   */
  // Note: For mobile apps, implement token verification with Google's tokeninfo API
  // This is a placeholder for the pattern - actual implementation would verify the token

  /**
   * Handle social auth for API clients
   */
  async handleApiSocialAuth(
    provider: SocialProvider,
    profile: { id: string; email: string; firstName: string; lastName: string; picture?: string },
    req: Request,
  ): Promise<{ data: SocialAuthResponseDto }> {
    const result = await this.socialAuthUseCase.execute({
      provider,
      providerId: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      picture: profile.picture,
      emailVerified: true,
      userAgent: req.headers['user-agent'],
      ipAddress: this.getClientIp(req),
    });

    if (!result.success) {
      throw new InternalServerErrorException(result.error.message);
    }

    return {
      data: {
        accessToken: result.value.accessToken,
        refreshToken: result.value.refreshToken,
        expiresIn: result.value.expiresIn,
        tokenType: result.value.tokenType,
        isNewUser: result.value.isNewUser,
      },
    };
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
}
