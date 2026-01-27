import { SetMetadata } from '@nestjs/common';

/**
 * Cache Metadata Keys
 */
export const CACHE_KEY = 'cache:key';
export const CACHE_TTL_KEY = 'cache:ttl';
export const CACHE_EVICT = 'cache:evict';
export const CACHE_OPTIONS = 'cache:options';

/**
 * Cache Options for decorators
 */
export interface CacheDecoratorOptions {
  /**
   * Cache key or key pattern
   * Supports placeholders: {param.name}, {query.name}, {body.name}, {user.id}
   * @example 'user:{param.id}' -> 'user:123'
   */
  key?: string;

  /**
   * Time to live in seconds
   */
  ttl?: number;

  /**
   * Cache condition - function that returns true to cache
   */
  condition?: string;

  /**
   * Key prefix
   */
  prefix?: string;
}

/**
 * Cache Evict Options
 */
export interface CacheEvictOptions {
  /**
   * Key or pattern to evict
   * Use * for wildcard: 'user:*' evicts all user cache
   */
  key?: string;

  /**
   * Multiple keys to evict
   */
  keys?: string[];

  /**
   * Evict all cache with this prefix
   */
  allEntries?: boolean;

  /**
   * When to evict: 'before' or 'after' method execution
   */
  when?: 'before' | 'after';
}

/**
 * @Cacheable decorator
 *
 * Caches method result. On subsequent calls with same key,
 * returns cached value instead of executing method.
 *
 * @example
 * ```typescript
 * @Cacheable({ key: 'user:{param.id}', ttl: 300 })
 * async getUser(@Param('id') id: string) {
 *   return this.userService.findById(id);
 * }
 *
 * @Cacheable({ key: 'users:list', ttl: 60 })
 * async getUsers() {
 *   return this.userService.findAll();
 * }
 * ```
 */
export function Cacheable(options: CacheDecoratorOptions = {}): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    SetMetadata(CACHE_OPTIONS, { ...options, type: 'cacheable' })(target, propertyKey, descriptor);
    return descriptor;
  };
}

/**
 * @CacheEvict decorator
 *
 * Evicts cache entries when method is called.
 * Use after mutations (create, update, delete).
 *
 * @example
 * ```typescript
 * @CacheEvict({ key: 'user:{param.id}' })
 * async updateUser(@Param('id') id: string, dto: UpdateUserDto) {
 *   return this.userService.update(id, dto);
 * }
 *
 * @CacheEvict({ keys: ['users:list', 'user:{param.id}'] })
 * async deleteUser(@Param('id') id: string) {
 *   return this.userService.delete(id);
 * }
 *
 * @CacheEvict({ key: 'users:*', allEntries: true })
 * async clearAllUserCache() {
 *   // Evicts all cache entries matching 'users:*'
 * }
 * ```
 */
export function CacheEvict(options: CacheEvictOptions = {}): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    SetMetadata(CACHE_EVICT, { ...options, when: options.when || 'after' })(
      target,
      propertyKey,
      descriptor,
    );
    return descriptor;
  };
}

/**
 * @CacheTTL decorator
 *
 * Sets custom TTL for cache. Can be used standalone or with @Cacheable.
 *
 * @example
 * ```typescript
 * @CacheTTL(600) // 10 minutes
 * @Cacheable({ key: 'config' })
 * async getConfig() {
 *   return this.configService.getAll();
 * }
 * ```
 */
export function CacheTTL(ttl: number): MethodDecorator {
  return SetMetadata(CACHE_TTL_KEY, ttl);
}

/**
 * @CacheKey decorator
 *
 * Sets custom cache key. Can be used standalone or with @Cacheable.
 *
 * @example
 * ```typescript
 * @CacheKey('dashboard:stats')
 * @Cacheable()
 * async getDashboardStats() {
 *   return this.statsService.getDashboard();
 * }
 * ```
 */
export function CacheKey(key: string): MethodDecorator {
  return SetMetadata(CACHE_KEY, key);
}

/**
 * @NoCache decorator
 *
 * Explicitly disables caching for a method.
 *
 * @example
 * ```typescript
 * @NoCache()
 * async getSensitiveData() {
 *   return this.sensitiveService.getData();
 * }
 * ```
 */
export function NoCache(): MethodDecorator {
  return SetMetadata(CACHE_OPTIONS, { type: 'nocache' });
}
