import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { generateRequestId } from '../utils';
import { LogContextService, LOG_CONTEXT } from '@infrastructure/logger/log-context.service';

/**
 * Correlation ID Middleware
 *
 * Extracts or generates correlation ID for request tracing.
 * Uses AsyncLocalStorage to propagate context through async operations.
 *
 * Section 12.7: Correlation ID Propagation
 * Order: Early in middleware chain (Section 4.1)
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(
    @Inject(LOG_CONTEXT)
    private readonly logContext: LogContextService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // Extract from header or generate new
    const correlationId = (req.headers['x-request-id'] as string) || generateRequestId();

    // Attach to request for use in handlers
    req.correlationId = correlationId;

    // Set response header for client reference
    res.setHeader('X-Request-Id', correlationId);

    // Extract user info if available (will be populated by auth middleware later)
    const user = req.user as { id?: string; tenantId?: string } | undefined;

    // Run the rest of the request in the log context
    this.logContext.run(
      {
        correlationId,
        userId: user?.id,
        tenantId: (req.headers['x-tenant-id'] as string) || user?.tenantId,
        method: req.method,
        path: req.url,
        ip: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
      () => {
        next();
      },
    );
  }
}
