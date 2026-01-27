import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { JwtPayload } from '@modules/auth/infrastructure/services/jwt.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ErrorCode } from '../constants';

/**
 * Permission-based Access Control Guard
 * Order: 4 in guard execution (Section 4.2)
 *
 * Checks if user has ALL required permissions.
 * Must be used after JwtAuthGuard.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No permissions required - allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload | undefined;

    if (!user) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Access denied: Authentication required',
      });
    }

    // Check if user has ALL required permissions
    const userPermissions = user.permissions ?? [];
    const missingPermissions = requiredPermissions.filter((p) => !userPermissions.includes(p));

    if (missingPermissions.length > 0) {
      throw new ForbiddenException({
        code: ErrorCode.INSUFFICIENT_PERMISSION,
        message: `Access denied: Missing permissions [${missingPermissions.join(', ')}]`,
      });
    }

    return true;
  }
}
