import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Inject, Optional } from '@nestjs/common';
import type { Job } from 'bull';
import { type ILogger, LOGGER, type ICache, CACHE } from '@core/domain/ports/services';
import { CLEANUP_QUEUE } from '../queues/queue.constants';
import { CleanupJobType, type CleanupJobData } from '../queues/cleanup-queue.service';
import {
  type IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../persistence/typeorm/repositories/refresh-token.repository';

/**
 * Cleanup Processor
 *
 * Processes cleanup jobs from the queue.
 */
@Processor(CLEANUP_QUEUE)
export class CleanupProcessor {
  constructor(
    @Inject(LOGGER) private readonly logger: ILogger,
    @Optional()
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository?: IRefreshTokenRepository,
    @Optional() @Inject(CACHE) private readonly cacheService?: ICache,
  ) {}

  @OnQueueActive()
  onActive(job: Job<CleanupJobData>): void {
    this.logger.debug(`Processing cleanup job ${job.id}`, {
      jobId: job.id,
      type: job.data.type,
      dryRun: job.data.dryRun,
    });
  }

  @OnQueueCompleted()
  onCompleted(job: Job<CleanupJobData>, result: { deleted: number }): void {
    this.logger.info(`Cleanup job ${job.id} completed`, {
      jobId: job.id,
      type: job.data.type,
      deleted: result?.deleted || 0,
    });
  }

  @OnQueueFailed()
  onFailed(job: Job<CleanupJobData>, error: Error): void {
    this.logger.error(`Cleanup job ${job.id} failed`, error, {
      jobId: job.id,
      type: job.data.type,
      attempts: job.attemptsMade,
    });
  }

  @Process(CleanupJobType.EXPIRED_TOKENS)
  async processExpiredTokens(job: Job<CleanupJobData>): Promise<{ deleted: number }> {
    const { dryRun } = job.data;

    this.logger.info('Cleaning expired tokens', { dryRun });

    if (!this.refreshTokenRepository) {
      this.logger.warn('RefreshTokenRepository not available, skipping expired tokens cleanup');
      return { deleted: 0 };
    }

    if (dryRun) {
      this.logger.debug('[DRY RUN] Would delete expired tokens');
      return { deleted: 0 };
    }

    try {
      const deleted = await this.refreshTokenRepository.deleteExpiredTokens();
      this.logger.debug(`Deleted ${deleted} expired tokens`);
      return { deleted };
    } catch (error) {
      this.logger.error(`Failed to delete expired tokens: ${String(error)}`);
      throw error;
    }
  }

  @Process(CleanupJobType.EXPIRED_SESSIONS)
  processExpiredSessions(job: Job<CleanupJobData>): { deleted: number } {
    const { olderThan, dryRun } = job.data;

    this.logger.info('Cleaning expired sessions', {
      olderThan,
      dryRun,
    });

    // TODO: Inject SessionRepository and clean expired sessions
    const deleted = dryRun ? 0 : 0;

    this.logger.debug(
      `${dryRun ? '[DRY RUN] Would delete' : 'Deleted'} ${deleted} expired sessions`,
    );

    return { deleted };
  }

  @Process(CleanupJobType.ORPHANED_FILES)
  processOrphanedFiles(job: Job<CleanupJobData>): { deleted: number } {
    const { olderThan, dryRun } = job.data;

    this.logger.info('Cleaning orphaned files', {
      olderThan,
      dryRun,
    });

    // TODO: Inject StorageService and clean orphaned files
    const deleted = dryRun ? 0 : 0;

    this.logger.debug(`${dryRun ? '[DRY RUN] Would delete' : 'Deleted'} ${deleted} orphaned files`);

    return { deleted };
  }

  @Process(CleanupJobType.AUDIT_LOGS)
  processAuditLogs(job: Job<CleanupJobData>): { deleted: number } {
    const { olderThan, batchSize, dryRun } = job.data;

    this.logger.info('Archiving audit logs', {
      olderThan,
      batchSize,
      dryRun,
    });

    // TODO: Archive audit logs to cold storage and delete from main DB
    const deleted = dryRun ? 0 : 0;

    this.logger.debug(`${dryRun ? '[DRY RUN] Would archive' : 'Archived'} ${deleted} audit logs`);

    return { deleted };
  }

  @Process(CleanupJobType.TEMP_DATA)
  async processTempData(job: Job<CleanupJobData>): Promise<{ deleted: number }> {
    const { dryRun } = job.data;

    this.logger.info('Cleaning temp data', { dryRun });

    if (dryRun) {
      this.logger.debug('[DRY RUN] Would clear cache');
      return { deleted: 0 };
    }

    // Clear cache entries
    if (this.cacheService) {
      try {
        await this.cacheService.clear();
        this.logger.debug('Cache cleared successfully');
      } catch (error) {
        this.logger.error(`Failed to clear cache: ${String(error)}`);
      }
    }

    // Note: File cleanup would require StorageService injection
    // For now, we only handle cache cleanup
    return { deleted: 0 };
  }
}
