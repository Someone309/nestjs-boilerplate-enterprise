/**
 * Cache Options
 */
export interface CacheOptions {
  /**
   * Time to live in seconds
   */
  ttl?: number;

  /**
   * Cache key prefix
   */
  prefix?: string;
}

/**
 * Cache Interface
 *
 * Provides caching functionality with TTL support.
 * Implementations can use Redis, in-memory, or other backends.
 *
 * Section 7.1: Data Storage - Cache for performance optimization
 * Section 12.4: Caching Strategy
 */
export interface ICache {
  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param options Cache options
   */
  set(key: string, value: unknown, options?: CacheOptions): Promise<void>;

  /**
   * Delete a value from cache
   * @param key Cache key
   * @returns True if deleted
   */
  delete(key: string): Promise<boolean>;

  /**
   * Delete multiple values by pattern
   * @param pattern Key pattern (e.g., "user:*")
   * @returns Number of deleted keys
   */
  deleteByPattern(pattern: string): Promise<number>;

  /**
   * Check if key exists in cache
   * @param key Cache key
   * @returns True if exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get remaining TTL for a key
   * @param key Cache key
   * @returns TTL in seconds or -1 if no TTL
   */
  getTTL(key: string): Promise<number>;

  /**
   * Set/update TTL for a key
   * @param key Cache key
   * @param ttl TTL in seconds
   * @returns True if TTL was set
   */
  setTTL(key: string, ttl: number): Promise<boolean>;

  /**
   * Get or set with callback
   * If key doesn't exist, call factory and cache result
   * @param key Cache key
   * @param factory Function to generate value
   * @param options Cache options
   */
  getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheOptions): Promise<T>;

  /**
   * Increment a numeric value
   * @param key Cache key
   * @param increment Increment amount (default: 1)
   * @returns New value
   */
  increment(key: string, increment?: number): Promise<number>;

  /**
   * Decrement a numeric value
   * @param key Cache key
   * @param decrement Decrement amount (default: 1)
   * @returns New value
   */
  decrement(key: string, decrement?: number): Promise<number>;

  /**
   * Clear all cache
   */
  clear(): Promise<void>;
}

/**
 * Cache Token for dependency injection
 */
export const CACHE = Symbol('CACHE');
