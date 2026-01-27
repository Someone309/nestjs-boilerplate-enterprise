import { type CustomDecorator, SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for a route
 * Used with PermissionsGuard (Section 4.2)
 *
 * @example
 * ```typescript
 * @Permissions('user:read', 'user:write')
 * @Post('users')
 * createUser(@Body() dto: CreateUserDto) {
 *   return this.userService.create(dto);
 * }
 * ```
 */
export const Permissions = (...permissions: string[]): CustomDecorator =>
  SetMetadata(PERMISSIONS_KEY, permissions);
