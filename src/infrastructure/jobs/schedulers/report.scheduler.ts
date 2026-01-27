import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { type ILogger, LOGGER } from '@core/domain/ports/services';
import { CleanupQueueService } from '../queues/cleanup-queue.service';

/**
 * Report Scheduler
 *
 * Schedules periodic reports and audit log archival.
 */
@Injectable()
export class ReportScheduler {
  constructor(
    @Inject(LOGGER) private readonly logger: ILogger,
    private readonly cleanupQueueService: CleanupQueueService,
  ) {}

  /**
   * Archive audit logs weekly on Sunday at 2 AM
   * Archives logs older than 90 days
   */
  @Cron('0 2 * * 0')
  async archiveAuditLogs(): Promise<void> {
    this.logger.info('Scheduling audit logs archival');

    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      await this.cleanupQueueService.archiveAuditLogs(ninetyDaysAgo, 5000);
      this.logger.debug('Audit logs archival job queued');
    } catch (error) {
      this.logger.error('Failed to queue audit logs archival', error as Error);
    }
  }

  /**
   * Log queue statistics every day at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async logQueueStatistics(): Promise<void> {
    this.logger.info('Collecting queue statistics');

    try {
      const status = await this.cleanupQueueService.getQueueStatus();
      this.logger.info('Cleanup queue statistics', {
        waiting: status.waiting,
        active: status.active,
        completed: status.completed,
        failed: status.failed,
        delayed: status.delayed,
      });
    } catch (error) {
      this.logger.error('Failed to collect queue statistics', error as Error);
    }
  }
}
