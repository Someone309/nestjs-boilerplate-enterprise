import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '@modules/auth/infrastructure/services/jwt.service';

/**
 * Parameter decorator to extract current user from request
 *
 * The user is attached to request by JwtAuthGuard after JWT verification.
 *
 * @example
 * ```typescript
 * // Get full user payload
 * @Get('profile')
 * getProfile(@CurrentUser() user: JwtPayload) {
 *   return this.userService.findById(user.sub);
 * }
 *
 * // Get specific property
 * @Get('my-id')
 * getMyId(@CurrentUser('sub') userId: string) {
 *   return { userId };
 * }
 *
 * // Get tenant ID
 * @Get('my-tenant')
 * getMyTenant(@CurrentUser('tenantId') tenantId: string) {
 *   return { tenantId };
 * }
 *
 * // Get roles
 * @Get('my-roles')
 * getMyRoles(@CurrentUser('roles') roles: string[]) {
 *   return { roles };
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload | undefined;

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);

/**
 * Parameter decorator to extract current tenant ID from request
 *
 * @example
 * ```typescript
 * @Get('tenant-data')
 * getTenantData(@CurrentTenant() tenantId: string) {
 *   return this.dataService.findByTenant(tenantId);
 * }
 * ```
 */
export const CurrentTenant = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const user = request.user as JwtPayload | undefined;
  return request.tenantId ?? user?.tenantId;
});

/**
 * Re-export ICurrentUser type for backward compatibility
 * @deprecated Use JwtPayload instead
 */
export type ICurrentUser = JwtPayload;
