import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request } from 'express';
import {
  CACHE_OPTIONS,
  CACHE_TTL_KEY,
  CACHE_KEY,
  CACHE_EVICT,
  type CacheDecoratorOptions,
  type CacheEvictOptions,
} from '../decorators/cache.decorator';
import { CACHE, type ICache, type ILogger, LOGGER } from '@core/domain/ports/services';

/**
 * Cache Interceptor
 *
 * Handles @Cacheable and @CacheEvict decorators.
 * Automatically caches method results and evicts cache on mutations.
 *
 * Section 12.4: Caching Strategy - Interceptor-based caching
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(CACHE) private readonly cacheService: ICache,
    @Inject(LOGGER) private readonly logger: ILogger,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();

    // Get cache metadata
    const cacheOptions = this.reflector.get<CacheDecoratorOptions & { type: string }>(
      CACHE_OPTIONS,
      context.getHandler(),
    );

    const customTtl = this.reflector.get<number>(CACHE_TTL_KEY, context.getHandler());
    const customKey = this.reflector.get<string>(CACHE_KEY, context.getHandler());
    const evictOptions = this.reflector.get<CacheEvictOptions>(CACHE_EVICT, context.getHandler());

    // No cache decorator
    if (!cacheOptions && !evictOptions) {
      return next.handle();
    }

    // Explicit no-cache
    if (cacheOptions?.type === 'nocache') {
      return next.handle();
    }

    // Handle cache eviction before method execution
    if (evictOptions?.when === 'before') {
      await this.evictCache(evictOptions, request, context);
    }

    // Handle @Cacheable
    if (cacheOptions?.type === 'cacheable') {
      const cacheKey = this.buildCacheKey(
        customKey || cacheOptions.key,
        cacheOptions.prefix,
        request,
        context,
      );

      const ttl = customTtl ?? cacheOptions.ttl ?? 300;

      // Try to get from cache
      try {
        const cached = await this.cacheService.get<unknown>(cacheKey);
        if (cached !== null) {
          this.logger.debug(`Cache HIT: ${cacheKey}`, 'CacheInterceptor');
          return of(cached);
        }
        this.logger.debug(`Cache MISS: ${cacheKey}`, 'CacheInterceptor');
      } catch (error) {
        this.logger.warn(`Cache GET error: ${String(error)}`, 'CacheInterceptor');
      }

      // Execute method and cache result
      return next.handle().pipe(
        tap((result) => {
          // Fire and forget - don't await
          void this.cacheService
            .set(cacheKey, result, { ttl })
            .then(() => {
              this.logger.debug(`Cache SET: ${cacheKey} (TTL: ${ttl}s)`, 'CacheInterceptor');
            })
            .catch((error: unknown) => {
              this.logger.warn(`Cache SET error: ${String(error)}`, 'CacheInterceptor');
            });
        }),
      );
    }

    // Execute method
    return next.handle().pipe(
      tap(() => {
        // Handle cache eviction after method execution - fire and forget
        if (evictOptions && evictOptions.when !== 'before') {
          void this.evictCache(evictOptions, request, context);
        }
      }),
    );
  }

  /**
   * Build cache key from template
   */
  private buildCacheKey(
    template: string | undefined,
    prefix: string | undefined,
    request: Request,
    context: ExecutionContext,
  ): string {
    if (!template) {
      // Auto-generate key from controller, method, and params
      const controller = context.getClass().name;
      const method = context.getHandler().name;
      const params = JSON.stringify(request.params);
      const query = JSON.stringify(request.query);
      return `${prefix || ''}${controller}:${method}:${params}:${query}`;
    }

    // Replace placeholders
    let key = template;

    // Replace {param.name}
    key = key.replace(/\{param\.(\w+)\}/g, (_, name: string) => {
      return String(request.params[name] || '');
    });

    // Replace {query.name}
    key = key.replace(/\{query\.(\w+)\}/g, (_, name: string) => {
      const value = request.query[name];
      return typeof value === 'string' ? value : '';
    });

    // Replace {body.name}
    key = key.replace(/\{body\.(\w+)\}/g, (_, name: string) => {
      const body = request.body as Record<string, unknown>;
      const value = body?.[name];
      return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
    });

    // Replace {user.name}
    key = key.replace(/\{user\.(\w+)\}/g, (_, name: string) => {
      const user = request.user as Record<string, unknown> | undefined;
      const value = user?.[name];
      return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
    });

    // Replace {tenant}
    key = key.replace(/\{tenant\}/g, () => {
      return request.tenantId || '';
    });

    return `${prefix || ''}${key}`;
  }

  /**
   * Evict cache entries
   */
  private async evictCache(
    options: CacheEvictOptions,
    request: Request,
    context: ExecutionContext,
  ): Promise<void> {
    try {
      if (options.allEntries && options.key) {
        // Evict by pattern
        const pattern = this.buildCacheKey(options.key, undefined, request, context);
        const count = await this.cacheService.deleteByPattern(pattern);
        this.logger.debug(`Cache EVICT pattern: ${pattern} (${count} keys)`, 'CacheInterceptor');
      } else if (options.keys) {
        // Evict multiple specific keys
        for (const keyTemplate of options.keys) {
          const key = this.buildCacheKey(keyTemplate, undefined, request, context);
          await this.cacheService.delete(key);
          this.logger.debug(`Cache EVICT: ${key}`, 'CacheInterceptor');
        }
      } else if (options.key) {
        // Evict single key
        const key = this.buildCacheKey(options.key, undefined, request, context);
        await this.cacheService.delete(key);
        this.logger.debug(`Cache EVICT: ${key}`, 'CacheInterceptor');
      }
    } catch (error) {
      this.logger.warn(`Cache EVICT error: ${String(error)}`, 'CacheInterceptor');
    }
  }
}
