import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { type ILogger, LOGGER } from '@core/domain/ports/services';
import { CleanupQueueService } from '../queues/cleanup-queue.service';

/**
 * Session Cleanup Scheduler
 *
 * Schedules periodic cleanup of expired sessions.
 */
@Injectable()
export class SessionCleanupScheduler {
  constructor(
    @Inject(LOGGER) private readonly logger: ILogger,
    private readonly cleanupQueueService: CleanupQueueService,
  ) {}

  /**
   * Clean expired sessions every 30 minutes
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async cleanExpiredSessions(): Promise<void> {
    this.logger.info('Scheduling expired sessions cleanup');

    try {
      await this.cleanupQueueService.cleanExpiredSessions();
      this.logger.debug('Expired sessions cleanup job queued');
    } catch (error) {
      this.logger.error('Failed to queue expired sessions cleanup', error as Error);
    }
  }

  /**
   * Clean orphaned files daily at 4 AM
   */
  @Cron('0 4 * * *')
  async cleanOrphanedFiles(): Promise<void> {
    this.logger.info('Scheduling orphaned files cleanup');

    try {
      await this.cleanupQueueService.cleanOrphanedFiles();
      this.logger.debug('Orphaned files cleanup job queued');
    } catch (error) {
      this.logger.error('Failed to queue orphaned files cleanup', error as Error);
    }
  }

  /**
   * Clean temp data every 2 hours
   */
  @Cron(CronExpression.EVERY_2_HOURS)
  async cleanTempData(): Promise<void> {
    this.logger.info('Scheduling temp data cleanup');

    try {
      await this.cleanupQueueService.cleanTempData();
      this.logger.debug('Temp data cleanup job queued');
    } catch (error) {
      this.logger.error('Failed to queue temp data cleanup', error as Error);
    }
  }
}
