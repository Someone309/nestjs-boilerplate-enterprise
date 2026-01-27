import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { QueueConfig } from '@config/queue.config';

// Queues
import { EmailQueueModule } from './queues/email-queue.module';
import { NotificationQueueModule } from './queues/notification-queue.module';
import { CleanupQueueModule } from './queues/cleanup-queue.module';

// Schedulers
import { TokenCleanupScheduler } from './schedulers/token-cleanup.scheduler';
import { SessionCleanupScheduler } from './schedulers/session-cleanup.scheduler';
import { ReportScheduler } from './schedulers/report.scheduler';

/**
 * Jobs Module
 *
 * Provides background job processing and scheduled tasks.
 *
 * Features:
 * - Bull queue for async job processing
 * - Redis-backed job persistence
 * - Job retry with exponential backoff
 * - Scheduled/cron tasks
 * - Job event monitoring
 *
 * Queue Types:
 * - email: Email sending (welcome, verification, reset)
 * - notification: Push notifications, webhooks
 * - cleanup: Data cleanup, maintenance tasks
 */
@Module({
  imports: [
    // Bull Queue Configuration
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const queueConfig = configService.get<QueueConfig>('queue');
        return {
          redis: {
            host: queueConfig?.redis.host || 'localhost',
            port: queueConfig?.redis.port || 6379,
            password: queueConfig?.redis.password,
            db: queueConfig?.redis.db || 0,
          },
          prefix: queueConfig?.prefix || 'bull',
          defaultJobOptions: queueConfig?.defaultJobOptions || {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
            removeOnComplete: 100,
            removeOnFail: 50,
          },
        };
      },
      inject: [ConfigService],
    }),

    // Schedule Module for Cron Jobs
    ScheduleModule.forRoot(),

    // Queue Modules
    EmailQueueModule,
    NotificationQueueModule,
    CleanupQueueModule,
  ],
  providers: [
    // Schedulers
    TokenCleanupScheduler,
    SessionCleanupScheduler,
    ReportScheduler,
  ],
  exports: [EmailQueueModule, NotificationQueueModule, CleanupQueueModule],
})
export class JobsModule {}
