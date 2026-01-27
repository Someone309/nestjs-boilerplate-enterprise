import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

/**
 * Metrics Interceptor
 *
 * Section 12.9: Production Checklist - Metrics exported (Prometheus)
 *
 * Automatically collects HTTP request metrics:
 * - Request duration
 * - Request count by status code
 * - Requests in progress
 * - Error counts
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const method = request.method;
    const routePath = (request.route as { path?: string } | undefined)?.path ?? request.path;
    const route = this.normalizeRoute(routePath);
    const startTime = process.hrtime.bigint();

    // Record request start
    this.metricsService.recordRequestStart(method, route);

    return next.handle().pipe(
      tap(() => {
        this.recordMetrics(method, route, response.statusCode, startTime);
      }),
      catchError((error: unknown) => {
        // For errors, use 500 as default or extract from error if available
        const statusCode =
          error instanceof Error && 'status' in error ? (error as { status: number }).status : 500;
        this.recordMetrics(method, route, statusCode, startTime);
        throw error;
      }),
    );
  }

  /**
   * Record request metrics
   */
  private recordMetrics(
    method: string,
    route: string,
    statusCode: number,
    startTime: bigint,
  ): void {
    const endTime = process.hrtime.bigint();
    const durationNs = Number(endTime - startTime);
    const durationSeconds = durationNs / 1e9;

    this.metricsService.recordRequestEnd(method, route, statusCode, durationSeconds);
  }

  /**
   * Normalize route path for consistent metrics labels
   * Replaces dynamic segments with placeholders
   */
  private normalizeRoute(path: string): string {
    if (!path) {
      return 'unknown';
    }

    // Replace UUIDs with :id
    let normalized = path.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ':id',
    );

    // Replace numeric IDs with :id
    normalized = normalized.replace(/\/\d+/g, '/:id');

    return normalized;
  }
}
