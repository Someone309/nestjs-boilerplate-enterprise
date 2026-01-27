/**
 * Application-wide constants
 */

// Pagination defaults (Section 11.8)
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MAX_PAGE_FOR_OFFSET: 100, // Use cursor for pages > 100
} as const;

// Request size limits (Section 12.5)
export const REQUEST_LIMITS = {
  JSON_BODY_SIZE: '1mb',
  URL_ENCODED_SIZE: '1mb',
  FILE_UPLOAD_SIZE: 50 * 1024 * 1024, // 50MB
  JSON_NESTING_DEPTH: 10,
} as const;

// Timeout settings (Section 12.6)
export const TIMEOUTS = {
  READ_QUERY_MS: 5000,
  WRITE_QUERY_MS: 10000,
  MIGRATION_MS: 300000,
  REPORT_QUERY_MS: 60000,
  HTTP_REQUEST_MS: 30000,
} as const;

// Cache TTL (Section 12.4)
export const CACHE_TTL = {
  USER_SESSION: 24 * 60 * 60, // 24 hours
  USER_PROFILE: 15 * 60, // 15 minutes
  CONFIGURATION: 5 * 60, // 5 minutes
  PUBLIC_LISTINGS: 60 * 60, // 1 hour
  SEARCH_RESULTS: 5 * 60, // 5 minutes
} as const;

// Rate limit tiers (Section 12.5)
export const RATE_LIMIT = {
  ANONYMOUS: { requests: 30, windowMs: 60000 }, // 30 req/min
  AUTHENTICATED: { requests: 100, windowMs: 60000 }, // 100 req/min
  PREMIUM: { requests: 500, windowMs: 60000 }, // 500 req/min
  INTERNAL: { requests: 1000, windowMs: 60000 }, // 1000 req/min
} as const;

// JWT settings (Section 12.5)
export const JWT = {
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  ALGORITHM: 'RS256' as const,
} as const;

// Health check intervals (Section 12.3)
export const HEALTH_CHECK = {
  LIVENESS_INTERVAL_MS: 10000,
  READINESS_INTERVAL_MS: 5000,
  STARTUP_TIMEOUT_MS: 30000,
} as const;
