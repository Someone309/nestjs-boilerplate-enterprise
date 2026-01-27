import { registerAs } from '@nestjs/config';

/**
 * Cache Configuration
 *
 * Following Section 12.4 - Caching Strategy
 */
export const cacheConfig = registerAs('cache', () => ({
  // Cache driver: 'memory' | 'redis'
  driver: (process.env.CACHE_DRIVER || 'memory') as 'memory' | 'redis',

  // In-memory cache defaults
  ttl: parseInt(process.env.CACHE_DEFAULT_TTL || '300', 10), // Default TTL in seconds
  max: parseInt(process.env.CACHE_MAX_ITEMS || '100', 10), // Max items in cache

  // Redis connection (for distributed cache)
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),

  // Connection options
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
  commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000', 10),

  // Key prefix
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'app:',

  // Cache TTLs (Section 12.4)
  ttls: {
    userSession: parseInt(process.env.CACHE_TTL_USER_SESSION || '86400', 10), // 24h
    userProfile: parseInt(process.env.CACHE_TTL_USER_PROFILE || '900', 10), // 15min
    configuration: parseInt(process.env.CACHE_TTL_CONFIGURATION || '300', 10), // 5min
    publicListings: parseInt(process.env.CACHE_TTL_PUBLIC_LISTINGS || '3600', 10), // 1h
    searchResults: parseInt(process.env.CACHE_TTL_SEARCH_RESULTS || '300', 10), // 5min
  },
}));

/**
 * Type-safe cache configuration
 */
export type CacheConfig = ReturnType<typeof cacheConfig>;
