import { registerAs } from '@nestjs/config';

/**
 * Security Configuration
 *
 * Section 12.5: Security Hardening
 */
export const securityConfig = registerAs('security', () => ({
  rateLimit: {
    short: {
      ttl: parseInt(process.env.RATE_LIMIT_SHORT_TTL || '1000', 10), // 1 second
      limit: parseInt(process.env.RATE_LIMIT_SHORT_LIMIT || '10', 10), // 10 requests
    },
    medium: {
      ttl: parseInt(process.env.RATE_LIMIT_MEDIUM_TTL || '10000', 10), // 10 seconds
      limit: parseInt(process.env.RATE_LIMIT_MEDIUM_LIMIT || '50', 10), // 50 requests
    },
    long: {
      ttl: parseInt(process.env.RATE_LIMIT_LONG_TTL || '60000', 10), // 1 minute
      limit: parseInt(process.env.RATE_LIMIT_LONG_LIMIT || '100', 10), // 100 requests
    },
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    credentials: process.env.CORS_CREDENTIALS === 'true',
    maxAge: parseInt(process.env.CORS_MAX_AGE || '86400', 10), // 24 hours
  },
  requestLimits: {
    jsonBodyLimit: process.env.JSON_BODY_LIMIT || '1mb',
    urlEncodedLimit: process.env.URL_ENCODED_LIMIT || '1mb',
  },
  jwt: {
    accessTokenTtl: process.env.JWT_ACCESS_TOKEN_TTL || '15m',
    refreshTokenTtl: process.env.JWT_REFRESH_TOKEN_TTL || '7d',
    issuer: process.env.JWT_ISSUER || 'nestjs-boilerplate',
    audience: process.env.JWT_AUDIENCE || 'nestjs-boilerplate-api',
  },
}));

export type SecurityConfig = ReturnType<typeof securityConfig>;
