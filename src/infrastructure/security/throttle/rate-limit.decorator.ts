import { SetMetadata } from '@nestjs/common';
import { RATE_LIMIT_TIER, type RateLimitTier } from './custom-throttler.guard';

// Re-export the type for convenience
export type { RateLimitTier };

/**
 * Rate Limit Tier Decorator
 *
 * Sets explicit rate limit tier for a route or controller.
 *
 * Section 12.5: Rate Limiting Tiers
 *
 * @example
 * // Apply premium tier to specific route
 * @SetRateLimitTier('premium')
 * @Get('premium-feature')
 * getPremiumFeature() { ... }
 *
 * @example
 * // Apply internal tier to service-to-service endpoints
 * @SetRateLimitTier('internal')
 * @Controller('internal')
 * class InternalController { ... }
 */
export const SetRateLimitTier = (tier: RateLimitTier): ReturnType<typeof SetMetadata> =>
  SetMetadata(RATE_LIMIT_TIER, tier);

/**
 * Skip Rate Limiting
 *
 * Decorator to completely skip rate limiting for a route.
 * Use with caution - only for health checks or internal endpoints.
 */
export const SkipThrottle = (): ReturnType<typeof SetMetadata> => SetMetadata('skipThrottle', true);
