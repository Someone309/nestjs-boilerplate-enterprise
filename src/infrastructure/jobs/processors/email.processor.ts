import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import type { Job } from 'bull';
import { type ILogger, LOGGER } from '@core/domain/ports/services';
import { type IEmailService, EMAIL_SERVICE } from '@core/domain/ports/services/email.interface';
import { EMAIL_QUEUE } from '../queues/queue.constants';
import { EmailJobType, type EmailJobData } from '../queues/email-queue.service';

/**
 * Email Processor
 *
 * Processes email jobs from the queue.
 */
@Processor(EMAIL_QUEUE)
export class EmailProcessor {
  constructor(
    @Inject(LOGGER) private readonly logger: ILogger,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
  ) {}

  @OnQueueActive()
  onActive(job: Job<EmailJobData>): void {
    this.logger.debug(`Processing email job ${job.id}`, {
      jobId: job.id,
      type: job.data.type,
      to: job.data.to,
    });
  }

  @OnQueueCompleted()
  onCompleted(job: Job<EmailJobData>): void {
    this.logger.info(`Email job ${job.id} completed`, {
      jobId: job.id,
      type: job.data.type,
      to: job.data.to,
    });
  }

  @OnQueueFailed()
  onFailed(job: Job<EmailJobData>, error: Error): void {
    this.logger.error(`Email job ${job.id} failed`, error, {
      jobId: job.id,
      type: job.data.type,
      to: job.data.to,
      attempts: job.attemptsMade,
    });
  }

  @Process(EmailJobType.WELCOME)
  async processWelcome(job: Job<EmailJobData>): Promise<void> {
    const { to, context } = job.data;
    const recipient = Array.isArray(to) ? to[0] : to;
    const name = (context?.name as string) || 'User';

    await this.emailService.sendWelcomeEmail(recipient, name);
  }

  @Process(EmailJobType.VERIFICATION)
  async processVerification(job: Job<EmailJobData>): Promise<void> {
    const { to, context } = job.data;
    const recipient = Array.isArray(to) ? to[0] : to;
    const token = context?.token as string;
    const name = context?.name as string | undefined;

    await this.emailService.sendVerificationEmail(recipient, token, name);
  }

  @Process(EmailJobType.PASSWORD_RESET)
  async processPasswordReset(job: Job<EmailJobData>): Promise<void> {
    const { to, context } = job.data;
    const recipient = Array.isArray(to) ? to[0] : to;
    const token = context?.token as string;
    const name = context?.name as string | undefined;

    await this.emailService.sendPasswordResetEmail(recipient, token, name);
  }

  @Process(EmailJobType.NOTIFICATION)
  async processNotification(job: Job<EmailJobData>): Promise<void> {
    const { to, subject, template, context } = job.data;
    const recipients = Array.isArray(to) ? to : [to];

    for (const recipient of recipients) {
      await this.emailService.sendTemplate(
        template || 'notification',
        recipient,
        subject || 'Notification',
        context || {},
      );
    }
  }

  @Process(EmailJobType.BULK)
  async processBulk(job: Job<EmailJobData>): Promise<void> {
    const { to, subject, template, context } = job.data;
    const recipients = Array.isArray(to) ? to : [to];

    // Process in batches to avoid overwhelming the SMTP server
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      await Promise.all(
        batch.map((recipient) =>
          this.emailService.sendTemplate(
            template || 'notification',
            recipient,
            subject || 'Notification',
            context || {},
          ),
        ),
      );

      // Update job progress
      const progress = Math.min(100, Math.round(((i + batch.length) / recipients.length) * 100));
      await job.progress(progress);
    }
  }
}
