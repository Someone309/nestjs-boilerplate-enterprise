import { Global, Module, type DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import type { CacheConfig } from '@config/cache.config';
import { CACHE } from '@core/domain/ports/services';
import { CacheService } from './cache.service';
import { RedisCacheService } from './redis-cache.service';

/**
 * Cache Module
 *
 * Provides caching functionality with support for:
 * - In-memory cache (default, for development/single-instance)
 * - Redis cache (for production/multi-instance)
 *
 * Configuration via environment:
 * - CACHE_DRIVER=memory|redis
 * - REDIS_HOST, REDIS_PORT, REDIS_PASSWORD (when using redis)
 *
 * Section 3.1: Core Modules - CacheModule
 * Section 12.4: Caching Strategy
 */
@Global()
@Module({})
export class CacheModule {
  static forRoot(): DynamicModule {
    return {
      module: CacheModule,
      imports: [
        ConfigModule,
        NestCacheModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const cacheConfig = configService.get<CacheConfig>('cache');
            return {
              ttl: (cacheConfig?.ttl || 300) * 1000, // Convert to milliseconds
              max: cacheConfig?.max || 100,
            };
          },
        }),
      ],
      providers: [
        CacheService,
        RedisCacheService,
        {
          provide: CACHE,
          useFactory: (
            configService: ConfigService,
            memoryCache: CacheService,
            redisCache: RedisCacheService,
          ) => {
            const cacheConfig = configService.get<CacheConfig>('cache');
            const driver: 'memory' | 'redis' = cacheConfig?.driver ?? 'memory';
            return driver === 'redis' ? redisCache : memoryCache;
          },
          inject: [ConfigService, CacheService, RedisCacheService],
        },
      ],
      exports: [CACHE, NestCacheModule],
    };
  }
}
