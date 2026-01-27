import { type CustomDecorator, SetMetadata } from '@nestjs/common';
import { SKIP_TENANT_CHECK_KEY } from '../guards/tenant.guard';

/**
 * Decorator to skip tenant check for specific routes
 * Used for routes that don't require tenant isolation (e.g., public endpoints, cross-tenant operations)
 *
 * @example
 * ```typescript
 * @SkipTenantCheck()
 * @Get('public-data')
 * getPublicData() {
 *   return this.dataService.getPublic();
 * }
 * ```
 */
export const SkipTenantCheck = (): CustomDecorator => SetMetadata(SKIP_TENANT_CHECK_KEY, true);
