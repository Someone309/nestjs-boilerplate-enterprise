import { registerAs } from '@nestjs/config';

/**
 * Rate Limiting Configuration
 *
 * Following Section 12.5 - Rate Limiting Tiers
 */
export const throttleConfig = registerAs('throttle', () => ({
  // Global limits (per minute)
  global: {
    ttl: parseInt(process.env.THROTTLE_GLOBAL_TTL || '60000', 10), // 1 minute
    limit: parseInt(process.env.THROTTLE_GLOBAL_LIMIT || '100', 10),
  },

  // Tier-specific limits (Section 12.5)
  tiers: {
    anonymous: {
      ttl: 60000, // 1 minute
      limit: parseInt(process.env.THROTTLE_ANONYMOUS_LIMIT || '30', 10),
      burst: 10,
    },
    authenticated: {
      ttl: 60000,
      limit: parseInt(process.env.THROTTLE_AUTHENTICATED_LIMIT || '100', 10),
      burst: 30,
    },
    premium: {
      ttl: 60000,
      limit: parseInt(process.env.THROTTLE_PREMIUM_LIMIT || '500', 10),
      burst: 100,
    },
    internal: {
      ttl: 60000,
      limit: parseInt(process.env.THROTTLE_INTERNAL_LIMIT || '1000', 10),
      burst: 500,
    },
  },

  // Throttle storage (should use Redis in production)
  storage: (process.env.THROTTLE_STORAGE as 'memory' | 'redis') || 'memory',

  // Skip throttling for certain conditions
  skipIf: {
    localhost: process.env.THROTTLE_SKIP_LOCALHOST === 'true',
  },
}));

export type ThrottleConfig = ReturnType<typeof throttleConfig>;
