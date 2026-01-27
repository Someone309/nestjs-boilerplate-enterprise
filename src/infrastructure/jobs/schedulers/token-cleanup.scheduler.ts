import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { type ILogger, LOGGER } from '@core/domain/ports/services';
import { CleanupQueueService } from '../queues/cleanup-queue.service';

/**
 * Token Cleanup Scheduler
 *
 * Schedules periodic cleanup of expired tokens.
 */
@Injectable()
export class TokenCleanupScheduler {
  constructor(
    @Inject(LOGGER) private readonly logger: ILogger,
    private readonly cleanupQueueService: CleanupQueueService,
  ) {}

  /**
   * Clean expired refresh tokens every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanExpiredRefreshTokens(): Promise<void> {
    this.logger.info('Scheduling expired refresh tokens cleanup');

    try {
      await this.cleanupQueueService.cleanExpiredTokens();
      this.logger.debug('Expired refresh tokens cleanup job queued');
    } catch (error) {
      this.logger.error('Failed to queue expired refresh tokens cleanup', error as Error);
    }
  }

  /**
   * Clean very old tokens (30+ days) daily at 3 AM
   */
  @Cron('0 3 * * *')
  async cleanOldTokens(): Promise<void> {
    this.logger.info('Scheduling old tokens cleanup');

    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      await this.cleanupQueueService.cleanExpiredTokens(thirtyDaysAgo);
      this.logger.debug('Old tokens cleanup job queued');
    } catch (error) {
      this.logger.error('Failed to queue old tokens cleanup', error as Error);
    }
  }
}
