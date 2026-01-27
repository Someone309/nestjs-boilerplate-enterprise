import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { JwtPayload } from '@modules/auth/infrastructure/services/jwt.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ErrorCode } from '../constants';

/**
 * Role-based Access Control Guard
 * Order: 3 in guard execution (Section 4.2)
 *
 * Checks if user has at least one of the required roles.
 * Must be used after JwtAuthGuard.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No roles required - allow access
    if (!requiredRoles || requiredRoles.length === 0) {
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

    // Check if user has at least one of the required roles
    const userRoles = user.roles ?? [];
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException({
        code: ErrorCode.INSUFFICIENT_ROLE,
        message: `Access denied: Required roles [${requiredRoles.join(', ')}]`,
      });
    }

    return true;
  }
}
