import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { type ILogger, LOGGER } from '@core/domain/ports/services';

/**
 * Token Blacklist Service
 *
 * Manages token blacklisting for immediate revocation.
 *
 * Section 12.5: Token Blacklist Implementation
 * - Blacklisted tokens stored with TTL matching token expiry
 * - Used for logout and token invalidation
 */
@Injectable()
export class TokenBlacklistService {
  private readonly PREFIX = 'blacklist:';

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(LOGGER) private readonly logger: ILogger,
  ) {}

  /**
   * Add token to blacklist
   *
   * @param jti - JWT ID (unique token identifier)
   * @param exp - Token expiration timestamp (Unix seconds)
   */
  async blacklist(jti: string, exp: number): Promise<void> {
    // Calculate TTL - only store until token would naturally expire
    const ttl = exp - Math.floor(Date.now() / 1000);

    if (ttl > 0) {
      const key = this.getKey(jti);
      await this.cacheManager.set(key, '1', ttl * 1000); // cache-manager uses ms
      this.logger.debug(`Token blacklisted: ${jti}`, 'TokenBlacklistService');
    }
  }

  /**
   * Check if token is blacklisted
   *
   * @param jti - JWT ID to check
   * @returns true if blacklisted, false otherwise
   */
  async isBlacklisted(jti: string): Promise<boolean> {
    const key = this.getKey(jti);
    const result = await this.cacheManager.get(key);
    return result !== null && result !== undefined;
  }

  /**
   * Remove token from blacklist (for testing/admin purposes)
   *
   * @param jti - JWT ID to remove
   */
  async remove(jti: string): Promise<void> {
    const key = this.getKey(jti);
    await this.cacheManager.del(key);
    this.logger.debug(`Token removed from blacklist: ${jti}`, 'TokenBlacklistService');
  }

  /**
   * Get cache key for JTI
   */
  private getKey(jti: string): string {
    return `${this.PREFIX}${jti}`;
  }
}
