import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ErrorCode } from '../constants';
import { JwtService } from '@modules/auth/infrastructure/services/jwt.service';
import { TokenBlacklistService } from '@modules/auth/infrastructure/services/token-blacklist.service';

/**
 * JWT Authentication Guard
 * Order: 2 in guard execution (Section 4.2)
 *
 * Validates JWT tokens and attaches user payload to request.
 * Skips validation for routes marked with @Public() decorator.
 *
 * Features:
 * - Token verification with signature validation
 * - Blacklist checking (if enabled)
 * - Automatic user payload attachment to request
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    @Inject(TokenBlacklistService)
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Missing authentication token',
      });
    }

    // Verify and decode JWT
    const payload = this.jwtService.verifyAccessToken(token);

    if (!payload) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_TOKEN,
        message: 'Invalid or expired token',
      });
    }

    // Check if token is blacklisted (if blacklist is enabled)
    if (this.jwtService.isBlacklistEnabled() && payload.jti) {
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(payload.jti);
      if (isBlacklisted) {
        throw new UnauthorizedException({
          code: ErrorCode.TOKEN_REVOKED,
          message: 'Token has been revoked',
        });
      }
    }

    // Attach user payload to request
    request.user = payload;

    // Also attach tenantId for convenience
    if (payload.tenantId) {
      request.tenantId = payload.tenantId;
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
