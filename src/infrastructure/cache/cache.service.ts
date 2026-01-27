import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ICache, CacheOptions } from '@core/domain/ports/services';
import type { CacheConfig } from '@config/cache.config';

/**
 * Cache Entry with TTL
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

/**
 * In-Memory Cache Service Implementation
 *
 * Simple in-memory cache for development and single-instance deployments.
 * For production multi-instance, replace with Redis implementation.
 *
 * Section 12.4: Caching Strategy - L1 In-Memory
 */
@Injectable()
export class CacheService implements ICache {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly keyPrefix: string;
  private readonly defaultTTL: number;

  constructor(private readonly configService: ConfigService) {
    const cacheConfig = this.configService.get<CacheConfig>('cache');
    this.keyPrefix = cacheConfig?.keyPrefix || 'app:';
    this.defaultTTL = cacheConfig?.ttl || 300; // 5 minutes
  }

  private getFullKey(key: string, prefix?: string): string {
    return `${prefix || this.keyPrefix}${key}`;
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    if (entry.expiresAt === null) {
      return false;
    }
    return Date.now() > entry.expiresAt;
  }

  private cleanupExpired(): void {
    for (const [key, entry] of this.store.entries()) {
      if (this.isExpired(entry)) {
        this.store.delete(key);
      }
    }
  }

  get<T>(key: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);
    const entry = this.store.get(fullKey) as CacheEntry<T> | undefined;

    if (!entry) {
      return Promise.resolve(null);
    }

    if (this.isExpired(entry)) {
      this.store.delete(fullKey);
      return Promise.resolve(null);
    }

    return Promise.resolve(entry.value);
  }

  set(key: string, value: unknown, options?: CacheOptions): Promise<void> {
    const fullKey = this.getFullKey(key, options?.prefix);
    const ttl = options?.ttl ?? this.defaultTTL;

    const entry: CacheEntry<unknown> = {
      value,
      expiresAt: ttl > 0 ? Date.now() + ttl * 1000 : null,
    };

    this.store.set(fullKey, entry);

    // Periodic cleanup
    if (this.store.size % 100 === 0) {
      this.cleanupExpired();
    }

    return Promise.resolve();
  }

  delete(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    return Promise.resolve(this.store.delete(fullKey));
  }

  deleteByPattern(pattern: string): Promise<number> {
    const fullPattern = this.getFullKey(pattern);
    const regex = new RegExp(`^${fullPattern.replace(/\*/g, '.*')}$`);
    let count = 0;

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }

    return Promise.resolve(count);
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.get<unknown>(key);
    return value !== null;
  }

  getTTL(key: string): Promise<number> {
    const fullKey = this.getFullKey(key);
    const entry = this.store.get(fullKey);

    if (!entry || this.isExpired(entry)) {
      return Promise.resolve(-2); // Key doesn't exist
    }

    if (entry.expiresAt === null) {
      return Promise.resolve(-1); // No TTL
    }

    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return Promise.resolve(Math.max(0, remaining));
  }

  setTTL(key: string, ttl: number): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    const entry = this.store.get(fullKey);

    if (!entry || this.isExpired(entry)) {
      return Promise.resolve(false);
    }

    entry.expiresAt = ttl > 0 ? Date.now() + ttl * 1000 : null;
    return Promise.resolve(true);
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheOptions): Promise<T> {
    const existing = await this.get<T>(key);
    if (existing !== null) {
      return existing;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  increment(key: string, increment = 1): Promise<number> {
    const fullKey = this.getFullKey(key);
    const entry = this.store.get(fullKey) as CacheEntry<number> | undefined;

    let newValue: number;
    if (!entry || this.isExpired(entry)) {
      newValue = increment;
      this.store.set(fullKey, { value: newValue, expiresAt: null });
    } else {
      newValue = (entry.value || 0) + increment;
      entry.value = newValue;
    }

    return Promise.resolve(newValue);
  }

  async decrement(key: string, decrement = 1): Promise<number> {
    return this.increment(key, -decrement);
  }

  clear(): Promise<void> {
    this.store.clear();
    return Promise.resolve();
  }
}
