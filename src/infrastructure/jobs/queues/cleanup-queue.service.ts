import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, JobOptions } from 'bull';
import { CLEANUP_QUEUE } from './queue.constants';

/**
 * Cleanup Job Types
 */
export enum CleanupJobType {
  EXPIRED_TOKENS = 'expired-tokens',
  EXPIRED_SESSIONS = 'expired-sessions',
  ORPHANED_FILES = 'orphaned-files',
  AUDIT_LOGS = 'audit-logs',
  TEMP_DATA = 'temp-data',
}

/**
 * Cleanup Job Data
 */
export interface CleanupJobData {
  type: CleanupJobType;
  olderThan?: Date;
  batchSize?: number;
  dryRun?: boolean;
}

/**
 * Cleanup Queue Service
 *
 * Provides methods to add cleanup jobs to the queue.
 */
@Injectable()
export class CleanupQueueService {
  constructor(@InjectQueue(CLEANUP_QUEUE) private readonly cleanupQueue: Queue<CleanupJobData>) {}

  /**
   * Add expired tokens cleanup job
   */
  async cleanExpiredTokens(olderThan?: Date, dryRun = false): Promise<void> {
    await this.cleanupQueue.add(CleanupJobType.EXPIRED_TOKENS, {
      type: CleanupJobType.EXPIRED_TOKENS,
      olderThan: olderThan || new Date(),
      dryRun,
    });
  }

  /**
   * Add expired sessions cleanup job
   */
  async cleanExpiredSessions(olderThan?: Date, dryRun = false): Promise<void> {
    await this.cleanupQueue.add(CleanupJobType.EXPIRED_SESSIONS, {
      type: CleanupJobType.EXPIRED_SESSIONS,
      olderThan: olderThan || new Date(),
      dryRun,
    });
  }

  /**
   * Add orphaned files cleanup job
   */
  async cleanOrphanedFiles(olderThan?: Date, dryRun = false): Promise<void> {
    await this.cleanupQueue.add(CleanupJobType.ORPHANED_FILES, {
      type: CleanupJobType.ORPHANED_FILES,
      olderThan: olderThan || new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      dryRun,
    });
  }

  /**
   * Add audit logs archival job
   */
  async archiveAuditLogs(olderThan: Date, batchSize = 1000, dryRun = false): Promise<void> {
    await this.cleanupQueue.add(CleanupJobType.AUDIT_LOGS, {
      type: CleanupJobType.AUDIT_LOGS,
      olderThan,
      batchSize,
      dryRun,
    });
  }

  /**
   * Add temp data cleanup job
   */
  async cleanTempData(olderThan?: Date, dryRun = false): Promise<void> {
    await this.cleanupQueue.add(CleanupJobType.TEMP_DATA, {
      type: CleanupJobType.TEMP_DATA,
      olderThan: olderThan || new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      dryRun,
    });
  }

  /**
   * Add a custom cleanup job
   */
  async addJob(data: CleanupJobData, options?: JobOptions): Promise<void> {
    await this.cleanupQueue.add(data.type, data, options);
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.cleanupQueue.getWaitingCount(),
      this.cleanupQueue.getActiveCount(),
      this.cleanupQueue.getCompletedCount(),
      this.cleanupQueue.getFailedCount(),
      this.cleanupQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }
}
