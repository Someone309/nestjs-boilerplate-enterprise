import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { createHash } from 'crypto';
import type { Request, Response } from 'express';

/**
 * ETag Interceptor
 *
 * Section 12.9: Production Checklist - Response optimization
 *
 * Implements conditional GET requests using ETags:
 * - Generates ETag based on response content hash
 * - Handles If-None-Match header for 304 responses
 * - Reduces bandwidth for unchanged resources
 *
 * Usage: Apply to GET endpoints that return cacheable data.
 *
 * @example
 * @Get(':id')
 * @UseInterceptors(ETagInterceptor)
 * async findOne(@Param('id') id: string) {
 *   return this.service.findOne(id);
 * }
 */
@Injectable()
export class ETagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Only apply to GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    return next.handle().pipe(
      map((data: unknown) => {
        // Generate ETag from response data
        const etag = this.generateETag(data);

        // Check If-None-Match header
        const ifNoneMatch = request.headers['if-none-match'];

        if (ifNoneMatch && this.etagsMatch(ifNoneMatch, etag)) {
          // Resource not modified - return 304
          response.status(HttpStatus.NOT_MODIFIED);
          response.setHeader('ETag', etag);
          return undefined;
        }

        // Set ETag header for caching
        response.setHeader('ETag', etag);

        return data;
      }),
    );
  }

  /**
   * Generate ETag from data using MD5 hash
   */
  private generateETag(data: unknown): string {
    const content = JSON.stringify(data);
    const hash = createHash('md5').update(content).digest('hex');
    return `"${hash}"`;
  }

  /**
   * Check if ETags match (handles weak ETags)
   */
  private etagsMatch(ifNoneMatch: string, etag: string): boolean {
    // Handle multiple ETags separated by comma
    const clientEtags = ifNoneMatch.split(',').map((e) => e.trim());

    // Handle weak ETag comparison (W/"...")
    const normalizedEtag = etag.replace(/^W\//, '');

    return clientEtags.some((clientEtag) => {
      const normalizedClientEtag = clientEtag.replace(/^W\//, '');
      return normalizedClientEtag === normalizedEtag || normalizedClientEtag === '*';
    });
  }
}

/**
 * Weak ETag Interceptor
 *
 * Same as ETagInterceptor but generates weak ETags.
 * Weak ETags indicate semantic equivalence, not byte-for-byte equality.
 */
@Injectable()
export class WeakETagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    if (request.method !== 'GET') {
      return next.handle();
    }

    return next.handle().pipe(
      map((data: unknown) => {
        const etag = this.generateWeakETag(data);
        const ifNoneMatch = request.headers['if-none-match'];

        if (ifNoneMatch && this.etagsMatch(ifNoneMatch, etag)) {
          response.status(HttpStatus.NOT_MODIFIED);
          response.setHeader('ETag', etag);
          return undefined;
        }

        response.setHeader('ETag', etag);
        return data;
      }),
    );
  }

  private generateWeakETag(data: unknown): string {
    const content = JSON.stringify(data);
    const hash = createHash('md5').update(content).digest('hex').substring(0, 16);
    return `W/"${hash}"`;
  }

  private etagsMatch(ifNoneMatch: string, etag: string): boolean {
    const clientEtags = ifNoneMatch.split(',').map((e) => e.trim());
    const normalizedEtag = etag.replace(/^W\//, '');

    return clientEtags.some((clientEtag) => {
      const normalizedClientEtag = clientEtag.replace(/^W\//, '');
      return normalizedClientEtag === normalizedEtag || normalizedClientEtag === '*';
    });
  }
}
