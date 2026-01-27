/**
 * Cache Utility Functions
 *
 * Helper functions for cache key generation and management.
 *
 * Section 12.4: Caching Strategy
 */

/**
 * Cache Key Prefixes
 */
export const CachePrefix = {
  USER: 'user:',
  USER_SESSION: 'session:',
  USER_PROFILE: 'profile:',
  ROLE: 'role:',
  TENANT: 'tenant:',
  CONFIG: 'config:',
  PERMISSION: 'permission:',
  RATE_LIMIT: 'ratelimit:',
  TOKEN_BLACKLIST: 'blacklist:',
} as const;

/**
 * Default TTL values in seconds
 */
export const CacheTTLValues = {
  /** 1 minute - for frequently changing data */
  VERY_SHORT: 60,
  /** 5 minutes - default */
  SHORT: 300,
  /** 15 minutes - for user profiles */
  MEDIUM: 900,
  /** 1 hour - for configuration data */
  LONG: 3600,
  /** 24 hours - for static data */
  VERY_LONG: 86400,
  /** 7 days - for rarely changing data */
  WEEK: 604800,
} as const;

/**
 * Generate cache key for user-related data
 */
export function userCacheKey(userId: string, suffix?: string): string {
  return suffix ? `${CachePrefix.USER}${userId}:${suffix}` : `${CachePrefix.USER}${userId}`;
}

/**
 * Generate cache key for user session
 */
export function sessionCacheKey(sessionId: string): string {
  return `${CachePrefix.USER_SESSION}${sessionId}`;
}

/**
 * Generate cache key for user profile
 */
export function profileCacheKey(userId: string): string {
  return `${CachePrefix.USER_PROFILE}${userId}`;
}

/**
 * Generate cache key for role
 */
export function roleCacheKey(roleId: string): string {
  return `${CachePrefix.ROLE}${roleId}`;
}

/**
 * Generate cache key for tenant
 */
export function tenantCacheKey(tenantId: string, suffix?: string): string {
  return suffix ? `${CachePrefix.TENANT}${tenantId}:${suffix}` : `${CachePrefix.TENANT}${tenantId}`;
}

/**
 * Generate cache key for configuration
 */
export function configCacheKey(configKey: string): string {
  return `${CachePrefix.CONFIG}${configKey}`;
}

/**
 * Generate cache key for permissions
 */
export function permissionCacheKey(userId: string, tenantId?: string): string {
  return tenantId
    ? `${CachePrefix.PERMISSION}${tenantId}:${userId}`
    : `${CachePrefix.PERMISSION}${userId}`;
}

/**
 * Generate cache key for rate limiting
 */
export function rateLimitCacheKey(identifier: string, endpoint?: string): string {
  return endpoint
    ? `${CachePrefix.RATE_LIMIT}${identifier}:${endpoint}`
    : `${CachePrefix.RATE_LIMIT}${identifier}`;
}

/**
 * Generate cache key for token blacklist
 */
export function tokenBlacklistKey(tokenId: string): string {
  return `${CachePrefix.TOKEN_BLACKLIST}${tokenId}`;
}

/**
 * Generate a composite cache key from multiple parts
 */
export function composeCacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter((p) => p !== undefined && p !== '').join(':');
}

/**
 * Parse a cache key into its components
 */
export function parseCacheKey(key: string): string[] {
  return key.split(':');
}

/**
 * Create a cache key pattern for wildcard matching
 * @example createCachePattern('user', '*', 'profile') => 'user:*:profile'
 */
export function createCachePattern(...parts: string[]): string {
  return parts.join(':');
}

/**
 * Hash a value for use in cache keys (simple hash)
 */
export function hashForCacheKey(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Create a cache key from query parameters
 */
export function queryCacheKey(baseKey: string, query: Record<string, unknown>): string {
  const sortedKeys = Object.keys(query).sort();
  const queryString = sortedKeys
    .filter((key) => query[key] !== undefined && query[key] !== '')
    .map((key) => `${key}=${String(query[key])}`)
    .join('&');

  return queryString ? `${baseKey}:${hashForCacheKey(queryString)}` : baseKey;
}
