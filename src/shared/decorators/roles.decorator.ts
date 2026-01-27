import { type CustomDecorator, SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route
 * Used with RolesGuard (Section 4.2)
 *
 * @example
 * ```typescript
 * @Roles('admin', 'moderator')
 * @Get('admin/users')
 * getUsers() {
 *   return this.userService.findAll();
 * }
 * ```
 */
export const Roles = (...roles: string[]): CustomDecorator => SetMetadata(ROLES_KEY, roles);
