import { Injectable, OnModuleInit, OnModuleDestroy, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { LOGGER, type ICache, type CacheOptions, type ILogger } from '@core/domain/ports/services';
import type { CacheConfig } from '@config/cache.config';

/**
 * Redis Cache Service Implementation
 *
 * Production-ready cache implementation using ioredis.
 * Provides distributed caching for multi-instance deployments.
 *
 * Features:
 * - Automatic reconnection
 * - Cluster & Sentinel support
 * - Lua scripting support
 * - Pipeline & transactions
 *
 * Section 12.4: Caching Strategy - L2 Distributed Cache
 *
 * Configuration via environment:
 * - CACHE_DRIVER=redis (to enable)
 * - REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB
 */
@Injectable()
export class RedisCacheService implements ICache, OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private readonly keyPrefix: string;
  private readonly defaultTTL: number;
  private isConnected = false;

  constructor(
    private readonly configService: ConfigService,
    @Optional() @Inject(LOGGER) private readonly logger?: ILogger,
  ) {
    const cacheConfig = this.configService.get<CacheConfig>('cache');
    this.keyPrefix = cacheConfig?.keyPrefix || 'app:';
    this.defaultTTL = cacheConfig?.ttl || 300;
  }

  /**
   * Initialize Redis connection on module init
   */
  onModuleInit(): void {
    const cacheConfig = this.configService.get<CacheConfig>('cache');

    // Only connect if redis driver is selected
    if (cacheConfig?.driver !== 'redis') {
      this.logger?.debug?.('Redis cache disabled (using memory driver)', 'RedisCacheService');
      return;
    }

    try {
      this.client = new Redis({
        host: cacheConfig.host || 'localhost',
        port: cacheConfig.port || 6379,
        password: cacheConfig.password || undefined,
        db: cacheConfig.db || 0,
        connectTimeout: cacheConfig.connectTimeout || 10000,
        commandTimeout: cacheConfig.commandTimeout || 5000,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger?.error?.('Redis max retry reached', 'RedisCacheService');
            return null; // Stop retrying
          }
          return Math.min(times * 1000, 3000);
        },
        lazyConnect: false,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger?.log?.('Redis connected successfully', 'RedisCacheService');
      });

      this.client.on('error', (err) => {
        this.logger?.error?.(`Redis error: ${String(err)}`, 'RedisCacheService');
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.logger?.warn?.('Redis connection closed', 'RedisCacheService');
      });

      this.client.on('reconnecting', () => {
        this.logger?.warn?.('Redis reconnecting...', 'RedisCacheService');
      });
    } catch (error) {
      this.logger?.error?.(`Redis connection failed: ${String(error)}`, 'RedisCacheService');
      this.isConnected = false;
    }
  }

  /**
   * Disconnect Redis on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.logger?.log?.('Redis disconnected', 'RedisCacheService');
    }
  }

  private getFullKey(key: string, prefix?: string): string {
    return `${prefix || this.keyPrefix}${key}`;
  }

  private ensureConnected(): boolean {
    if (!this.client || !this.isConnected) {
      return false;
    }
    return true;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.ensureConnected() || !this.client) {
      return null;
    }

    try {
      const fullKey = this.getFullKey(key);
      const data = await this.client.get(fullKey);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as T;
    } catch (error) {
      this.logger?.error?.(`Redis GET error: ${String(error)}`, 'RedisCacheService');
      return null;
    }
  }

  async set(key: string, value: unknown, options?: CacheOptions): Promise<void> {
    if (!this.ensureConnected() || !this.client) {
      return;
    }

    try {
      const fullKey = this.getFullKey(key, options?.prefix);
      const ttl = options?.ttl ?? this.defaultTTL;
      const serialized = JSON.stringify(value);

      if (ttl > 0) {
        await this.client.setex(fullKey, ttl, serialized);
      } else {
        await this.client.set(fullKey, serialized);
      }
    } catch (error) {
      this.logger?.error?.(`Redis SET error: ${String(error)}`, 'RedisCacheService');
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.ensureConnected() || !this.client) {
      return false;
    }

    try {
      const fullKey = this.getFullKey(key);
      const result = await this.client.del(fullKey);
      return result > 0;
    } catch (error) {
      this.logger?.error?.(`Redis DEL error: ${String(error)}`, 'RedisCacheService');
      return false;
    }
  }

  async deleteByPattern(pattern: string): Promise<number> {
    if (!this.ensureConnected() || !this.client) {
      return 0;
    }

    try {
      const fullPattern = this.getFullKey(pattern);
      const keys = await this.client.keys(fullPattern);

      if (keys.length === 0) {
        return 0;
      }

      return await this.client.del(...keys);
    } catch (error) {
      this.logger?.error?.(`Redis DEL pattern error: ${String(error)}`, 'RedisCacheService');
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.ensureConnected() || !this.client) {
      return false;
    }

    try {
      const fullKey = this.getFullKey(key);
      const result = await this.client.exists(fullKey);
      return result > 0;
    } catch (error) {
      this.logger?.error?.(`Redis EXISTS error: ${String(error)}`, 'RedisCacheService');
      return false;
    }
  }

  async getTTL(key: string): Promise<number> {
    if (!this.ensureConnected() || !this.client) {
      return -2;
    }

    try {
      const fullKey = this.getFullKey(key);
      return await this.client.ttl(fullKey);
    } catch (error) {
      this.logger?.error?.(`Redis TTL error: ${String(error)}`, 'RedisCacheService');
      return -2;
    }
  }

  async setTTL(key: string, ttl: number): Promise<boolean> {
    if (!this.ensureConnected() || !this.client) {
      return false;
    }

    try {
      const fullKey = this.getFullKey(key);
      const result = await this.client.expire(fullKey, ttl);
      return result === 1;
    } catch (error) {
      this.logger?.error?.(`Redis EXPIRE error: ${String(error)}`, 'RedisCacheService');
      return false;
    }
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

  async increment(key: string, increment = 1): Promise<number> {
    if (!this.ensureConnected() || !this.client) {
      return 0;
    }

    try {
      const fullKey = this.getFullKey(key);
      return await this.client.incrby(fullKey, increment);
    } catch (error) {
      this.logger?.error?.(`Redis INCRBY error: ${String(error)}`, 'RedisCacheService');
      return 0;
    }
  }

  async decrement(key: string, decrement = 1): Promise<number> {
    return this.increment(key, -decrement);
  }

  async clear(): Promise<void> {
    if (!this.ensureConnected() || !this.client) {
      return;
    }

    try {
      // Only clear keys with our prefix using SCAN for safety
      const stream = this.client.scanStream({
        match: `${this.keyPrefix}*`,
        count: 100,
      });

      const pipeline = this.client.pipeline();
      let count = 0;

      for await (const keys of stream) {
        for (const key of keys as string[]) {
          pipeline.del(key);
          count++;
        }
      }

      if (count > 0) {
        await pipeline.exec();
      }

      this.logger?.log?.(`Redis cache cleared (${count} keys)`, 'RedisCacheService');
    } catch (error) {
      this.logger?.error?.(`Redis clear error: ${String(error)}`, 'RedisCacheService');
    }
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected && this.client?.status === 'ready';
  }

  /**
   * Get the underlying Redis client for advanced operations
   */
  getClient(): Redis | null {
    return this.client;
  }
}
