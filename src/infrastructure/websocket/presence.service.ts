import { Injectable, Inject } from '@nestjs/common';
import { type ILogger, LOGGER } from '@core/domain/ports/services';
import { type ICache, CACHE } from '@core/domain/ports/services/cache.interface';

export interface UserPresence {
  userId: string;
  socketId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  metadata?: Record<string, unknown>;
}

export interface PresenceUpdate {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
}

/**
 * Presence Service
 *
 * Tracks user online/offline status and presence information.
 */
@Injectable()
export class PresenceService {
  private readonly PRESENCE_PREFIX = 'presence:';
  private readonly PRESENCE_TTL = 300; // 5 minutes

  constructor(
    @Inject(LOGGER) private readonly logger: ILogger,
    @Inject(CACHE) private readonly cache: ICache,
  ) {}

  /**
   * Set user as online
   */
  async setOnline(
    userId: string,
    socketId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const presence: UserPresence = {
      userId,
      socketId,
      status: 'online',
      lastSeen: new Date(),
      metadata,
    };

    await this.cache.set(`${this.PRESENCE_PREFIX}${userId}`, JSON.stringify(presence), {
      ttl: this.PRESENCE_TTL,
    });

    // Track socket to user mapping
    await this.cache.set(`${this.PRESENCE_PREFIX}socket:${socketId}`, userId, {
      ttl: this.PRESENCE_TTL,
    });

    this.logger.debug('User online', { userId, socketId });
  }

  /**
   * Set user as offline
   */
  async setOffline(userId: string): Promise<void> {
    const presence = await this.getPresence(userId);
    if (presence) {
      // Remove socket mapping
      await this.cache.delete(`${this.PRESENCE_PREFIX}socket:${presence.socketId}`);
    }

    // Update presence with offline status (keep for a short time for "last seen")
    const offlinePresence: UserPresence = {
      userId,
      socketId: '',
      status: 'offline',
      lastSeen: new Date(),
    };

    await this.cache.set(`${this.PRESENCE_PREFIX}${userId}`, JSON.stringify(offlinePresence), {
      ttl: 60, // Keep offline status for 1 minute
    });

    this.logger.debug('User offline', { userId });
  }

  /**
   * Update user status
   */
  async updateStatus(userId: string, status: 'online' | 'away' | 'busy'): Promise<void> {
    const presence = await this.getPresence(userId);
    if (presence) {
      presence.status = status;
      presence.lastSeen = new Date();

      await this.cache.set(`${this.PRESENCE_PREFIX}${userId}`, JSON.stringify(presence), {
        ttl: this.PRESENCE_TTL,
      });

      this.logger.debug('User status updated', { userId, status });
    }
  }

  /**
   * Get user presence
   */
  async getPresence(userId: string): Promise<UserPresence | null> {
    const data = await this.cache.get<string>(`${this.PRESENCE_PREFIX}${userId}`);
    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as UserPresence;
    } catch {
      return null;
    }
  }

  /**
   * Check if user is online
   */
  async isOnline(userId: string): Promise<boolean> {
    const presence = await this.getPresence(userId);
    return presence?.status === 'online';
  }

  /**
   * Get user ID from socket ID
   */
  async getUserIdFromSocket(socketId: string): Promise<string | null> {
    return this.cache.get<string>(`${this.PRESENCE_PREFIX}socket:${socketId}`);
  }

  /**
   * Get multiple users' presence
   */
  async getMultiplePresence(userIds: string[]): Promise<Map<string, UserPresence>> {
    const presenceMap = new Map<string, UserPresence>();

    await Promise.all(
      userIds.map(async (userId) => {
        const presence = await this.getPresence(userId);
        if (presence) {
          presenceMap.set(userId, presence);
        }
      }),
    );

    return presenceMap;
  }

  /**
   * Heartbeat to keep presence alive
   */
  async heartbeat(userId: string): Promise<void> {
    const presence = await this.getPresence(userId);
    if (presence) {
      presence.lastSeen = new Date();
      await this.cache.set(`${this.PRESENCE_PREFIX}${userId}`, JSON.stringify(presence), {
        ttl: this.PRESENCE_TTL,
      });
    }
  }

  /**
   * Remove socket mapping (on disconnect)
   */
  async removeSocket(socketId: string): Promise<string | null> {
    const userId = await this.getUserIdFromSocket(socketId);
    if (userId) {
      await this.cache.delete(`${this.PRESENCE_PREFIX}socket:${socketId}`);
      return userId;
    }
    return null;
  }
}
