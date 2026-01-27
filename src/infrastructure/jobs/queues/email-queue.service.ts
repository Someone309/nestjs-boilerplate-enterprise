import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, JobOptions } from 'bull';
import { EMAIL_QUEUE } from './queue.constants';

/**
 * Email Job Types
 */
export enum EmailJobType {
  WELCOME = 'welcome',
  VERIFICATION = 'verification',
  PASSWORD_RESET = 'password-reset',
  NOTIFICATION = 'notification',
  BULK = 'bulk',
}

/**
 * Email Job Data
 */
export interface EmailJobData {
  type: EmailJobType;
  to: string | string[];
  subject?: string;
  template?: string;
  context?: Record<string, unknown>;
  attachments?: {
    filename: string;
    path?: string;
    content?: string | Buffer;
    contentType?: string;
  }[];
}

/**
 * Email Queue Service
 *
 * Provides methods to add email jobs to the queue.
 */
@Injectable()
export class EmailQueueService {
  constructor(@InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue<EmailJobData>) {}

  /**
   * Add a welcome email job
   */
  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.emailQueue.add(EmailJobType.WELCOME, {
      type: EmailJobType.WELCOME,
      to,
      template: 'welcome',
      context: { name },
    });
  }

  /**
   * Add a verification email job
   */
  async sendVerificationEmail(to: string, token: string, name?: string): Promise<void> {
    await this.emailQueue.add(EmailJobType.VERIFICATION, {
      type: EmailJobType.VERIFICATION,
      to,
      template: 'verification',
      context: { token, name: name || 'User' },
    });
  }

  /**
   * Add a password reset email job
   */
  async sendPasswordResetEmail(to: string, token: string, name?: string): Promise<void> {
    await this.emailQueue.add(EmailJobType.PASSWORD_RESET, {
      type: EmailJobType.PASSWORD_RESET,
      to,
      template: 'password-reset',
      context: { token, name: name || 'User' },
    });
  }

  /**
   * Add a notification email job
   */
  async sendNotificationEmail(
    to: string | string[],
    subject: string,
    template: string,
    context: Record<string, unknown>,
  ): Promise<void> {
    await this.emailQueue.add(EmailJobType.NOTIFICATION, {
      type: EmailJobType.NOTIFICATION,
      to,
      subject,
      template,
      context,
    });
  }

  /**
   * Add a bulk email job
   */
  async sendBulkEmail(
    recipients: string[],
    subject: string,
    template: string,
    context: Record<string, unknown>,
    options?: JobOptions,
  ): Promise<void> {
    await this.emailQueue.add(
      EmailJobType.BULK,
      {
        type: EmailJobType.BULK,
        to: recipients,
        subject,
        template,
        context,
      },
      {
        priority: 10, // Lower priority for bulk emails
        ...options,
      },
    );
  }

  /**
   * Add a custom email job
   */
  async addJob(data: EmailJobData, options?: JobOptions): Promise<void> {
    await this.emailQueue.add(data.type, data, options);
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
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Pause the queue
   */
  async pause(): Promise<void> {
    await this.emailQueue.pause();
  }

  /**
   * Resume the queue
   */
  async resume(): Promise<void> {
    await this.emailQueue.resume();
  }

  /**
   * Clean completed jobs older than grace period
   */
  async clean(grace: number = 24 * 60 * 60 * 1000): Promise<void> {
    await this.emailQueue.clean(grace, 'completed');
    await this.emailQueue.clean(grace, 'failed');
  }
}
