import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { JwtPayload } from '@modules/auth/infrastructure/services/jwt.service';
import { ErrorCode } from '../constants';

/**
 * Skip tenant check key for routes that don't need tenant isolation
 */
export const SKIP_TENANT_CHECK_KEY = 'skipTenantCheck';

/**
 * Tenant Isolation Guard
 * Order: 5 in guard execution (Section 4.2)
 *
 * Ensures multi-tenant data isolation by:
 * 1. Extracting tenant ID from header or token
 * 2. Validating user belongs to requested tenant
 * 3. Attaching tenantId to request for downstream use
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route should skip tenant validation
    const skipTenantCheck = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipTenantCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload | undefined;

    // Extract tenant ID from header or user token
    const headerTenantId = request.headers['x-tenant-id'] as string | undefined;
    const userTenantId = user?.tenantId;

    // If no tenant context required (public routes, single-tenant mode)
    if (!headerTenantId && !userTenantId) {
      // In single-tenant mode, allow access
      // In multi-tenant mode, this would be an error
      return true;
    }

    // If user has tenant context, validate it matches header (if provided)
    if (userTenantId && headerTenantId && userTenantId !== headerTenantId) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Tenant mismatch: Access denied',
      });
    }

    // Attach resolved tenant ID to request for downstream use
    const resolvedTenantId = userTenantId || headerTenantId;
    if (resolvedTenantId) {
      request.tenantId = resolvedTenantId;
    }

    return true;
  }
}
