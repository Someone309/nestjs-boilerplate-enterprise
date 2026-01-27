import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';

/**
 * Cache Control Options
 */
export interface CacheControlOptions {
  /** Max age in seconds */
  maxAge?: number;
  /** Shared (CDN) max age in seconds */
  sMaxAge?: number;
  /** Allow caching by shared caches */
  public?: boolean;
  /** Private cache only (user-specific) */
  private?: boolean;
  /** Prevent caching */
  noCache?: boolean;
  /** Don't store response */
  noStore?: boolean;
  /** Must revalidate with server */
  mustRevalidate?: boolean;
  /** Proxy must revalidate */
  proxyRevalidate?: boolean;
  /** Don't transform content */
  noTransform?: boolean;
  /** Allow stale response while revalidating */
  staleWhileRevalidate?: number;
  /** Allow stale response if error */
  staleIfError?: number;
}

/**
 * Metadata key for cache control
 */
export const CACHE_CONTROL_KEY = 'cache_control';

/**
 * Cache Control Decorator
 *
 * Apply to controller methods to set cache headers.
 *
 * @example
 * @Get(':id')
 * @CacheControl({ maxAge: 300, public: true })
 * findOne(@Param('id') id: string) {
 *   return this.service.findOne(id);
 * }
 */
export function CacheControl(options: CacheControlOptions): MethodDecorator {
  return (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    Reflect.defineMetadata(CACHE_CONTROL_KEY, options, descriptor.value as object);
    return descriptor;
  };
}

/**
 * No Cache Decorator
 *
 * Shorthand for preventing caching.
 */
export function NoCacheControl(): MethodDecorator {
  return CacheControl({ noCache: true, noStore: true, mustRevalidate: true });
}

/**
 * Public Cache Decorator
 *
 * Shorthand for public caching with specified max age.
 */
export function PublicCache(maxAge: number, sMaxAge?: number): MethodDecorator {
  return CacheControl({ public: true, maxAge, sMaxAge: sMaxAge || maxAge });
}

/**
 * Private Cache Decorator
 *
 * Shorthand for private (user-specific) caching.
 */
export function PrivateCache(maxAge: number): MethodDecorator {
  return CacheControl({ private: true, maxAge });
}

/**
 * Cache Control Interceptor
 *
 * Section 12.9: Production Checklist - Response optimization
 *
 * Sets Cache-Control headers based on decorator configuration.
 */
@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap(() => {
        const options = this.reflector.get<CacheControlOptions>(
          CACHE_CONTROL_KEY,
          context.getHandler(),
        );

        if (!options) {
          return;
        }

        const response = context.switchToHttp().getResponse<Response>();
        const cacheControlValue = this.buildCacheControlHeader(options);

        if (cacheControlValue) {
          response.setHeader('Cache-Control', cacheControlValue);
        }
      }),
    );
  }

  /**
   * Build Cache-Control header value from options
   */
  private buildCacheControlHeader(options: CacheControlOptions): string {
    const directives: string[] = [];

    if (options.public) {
      directives.push('public');
    }

    if (options.private) {
      directives.push('private');
    }

    if (options.noCache) {
      directives.push('no-cache');
    }

    if (options.noStore) {
      directives.push('no-store');
    }

    if (options.mustRevalidate) {
      directives.push('must-revalidate');
    }

    if (options.proxyRevalidate) {
      directives.push('proxy-revalidate');
    }

    if (options.noTransform) {
      directives.push('no-transform');
    }

    if (options.maxAge !== undefined) {
      directives.push(`max-age=${options.maxAge}`);
    }

    if (options.sMaxAge !== undefined) {
      directives.push(`s-maxage=${options.sMaxAge}`);
    }

    if (options.staleWhileRevalidate !== undefined) {
      directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
    }

    if (options.staleIfError !== undefined) {
      directives.push(`stale-if-error=${options.staleIfError}`);
    }

    return directives.join(', ');
  }
}

/**
 * Default cache configurations
 */
export const CACHE_CONFIGS = {
  /** No caching at all */
  NO_CACHE: { noCache: true, noStore: true, mustRevalidate: true } as CacheControlOptions,

  /** Short-lived public cache (5 minutes) */
  SHORT_PUBLIC: { public: true, maxAge: 300, sMaxAge: 300 } as CacheControlOptions,

  /** Medium public cache (1 hour) */
  MEDIUM_PUBLIC: { public: true, maxAge: 3600, sMaxAge: 3600 } as CacheControlOptions,

  /** Long-lived public cache (1 day) */
  LONG_PUBLIC: { public: true, maxAge: 86400, sMaxAge: 86400 } as CacheControlOptions,

  /** Private user-specific cache (15 minutes) */
  USER_SPECIFIC: { private: true, maxAge: 900 } as CacheControlOptions,

  /** Stale-while-revalidate (good for frequently updated content) */
  STALE_WHILE_REVALIDATE: {
    public: true,
    maxAge: 60,
    staleWhileRevalidate: 300,
  } as CacheControlOptions,
} as const;
