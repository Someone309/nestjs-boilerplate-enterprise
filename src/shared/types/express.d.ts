import type { JwtPayload } from '@modules/auth/infrastructure/services/jwt.service';

/**
 * Express Request Extension
 *
 * Extends Express Request to include user and tenant context
 * set by authentication guards.
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * Authenticated user payload from JWT
       */
      user?: JwtPayload;

      /**
       * Resolved tenant ID for multi-tenancy
       */
      tenantId?: string;

      /**
       * Request correlation ID for tracing
       */
      correlationId?: string;
    }
  }
}

export {};
