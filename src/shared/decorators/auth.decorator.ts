import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { TenantGuard } from '../guards/tenant.guard';
import { ROLES_KEY } from './roles.decorator';
import { PERMISSIONS_KEY } from './permissions.decorator';

/**
 * Auth decorator options
 */
export interface AuthOptions {
  /**
   * Required roles (user needs at least one)
   */
  roles?: string[];

  /**
   * Required permissions (user needs all)
   */
  permissions?: string[];

  /**
   * Skip tenant check for this route
   */
  skipTenantCheck?: boolean;
}

/**
 * Combined authentication and authorization decorator
 *
 * Applies JWT authentication, role check, permission check, and tenant guard
 * in the correct order. Also adds Swagger documentation.
 *
 * @example
 * ```typescript
 * // Basic authentication only
 * @Auth()
 * @Get('profile')
 * getProfile() {}
 *
 * // With role requirement
 * @Auth({ roles: ['admin'] })
 * @Get('admin/users')
 * getUsers() {}
 *
 * // With permission requirement
 * @Auth({ permissions: ['users:read', 'users:write'] })
 * @Post('users')
 * createUser() {}
 *
 * // Combined roles and permissions
 * @Auth({ roles: ['admin', 'manager'], permissions: ['reports:view'] })
 * @Get('reports')
 * getReports() {}
 * ```
 */
export function Auth(options: AuthOptions = {}): MethodDecorator & ClassDecorator {
  const decorators = [
    UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, TenantGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' }),
    ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' }),
  ];

  // Add roles metadata if specified
  if (options.roles && options.roles.length > 0) {
    decorators.push(SetMetadata(ROLES_KEY, options.roles));
  }

  // Add permissions metadata if specified
  if (options.permissions && options.permissions.length > 0) {
    decorators.push(SetMetadata(PERMISSIONS_KEY, options.permissions));
  }

  // Add skip tenant check metadata if specified
  if (options.skipTenantCheck) {
    decorators.push(SetMetadata('skipTenantCheck', true));
  }

  return applyDecorators(...decorators);
}

/**
 * Admin only decorator
 * Shorthand for @Auth({ roles: ['admin', 'super-admin'] })
 */
export function AdminOnly(): MethodDecorator & ClassDecorator {
  return Auth({ roles: ['admin', 'super-admin'] });
}

/**
 * Super admin only decorator
 * Shorthand for @Auth({ roles: ['super-admin'] })
 */
export function SuperAdminOnly(): MethodDecorator & ClassDecorator {
  return Auth({ roles: ['super-admin'] });
}
