import { Injectable, Inject, Optional } from '@nestjs/common';
import { OnEvent } from '@shared/decorators/event-handler.decorator';
import { LOGGER, type ILogger } from '@core/domain/ports/services';
import { UserCreatedEvent, UserUpdatedEvent, UserDeletedEvent } from '../../domain/events';
import { EmailQueueService } from '@infrastructure/jobs/queues/email-queue.service';
import { NotificationQueueService } from '@infrastructure/jobs/queues/notification-queue.service';

/**
 * User Event Handler
 *
 * Handles user domain events for cross-cutting concerns like
 * logging, notifications, and cache invalidation.
 *
 * Section 6.3: Event Flow - Event handlers for side effects
 */
@Injectable()
export class UserEventHandler {
  constructor(
    @Inject(LOGGER) private readonly logger: ILogger,
    @Optional() private readonly emailQueueService?: EmailQueueService,
    @Optional() private readonly notificationQueueService?: NotificationQueueService,
  ) {}

  /**
   * Handle user created event
   * - Log the event
   * - Send welcome email
   * - Notify admin
   */
  @OnEvent({ event: 'UserCreatedEvent', priority: 10 })
  async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    this.logger.log(
      `New user created: ${event.email} (ID: ${event.userId}) in tenant: ${event.tenantId}`,
      'UserEventHandler',
    );

    // Send welcome email (async via queue)
    if (this.emailQueueService) {
      try {
        await this.emailQueueService.sendWelcomeEmail(event.email, event.email.split('@')[0]);
        this.logger.debug(`Welcome email queued for: ${event.email}`, 'UserEventHandler');
      } catch (error) {
        this.logger.error(`Failed to queue welcome email: ${String(error)}`, 'UserEventHandler');
      }
    }

    // Notify admin via in-app notification
    if (this.notificationQueueService) {
      try {
        await this.notificationQueueService.sendInAppNotification(
          'admin', // Admin user ID or channel
          'New User Registered',
          `A new user has registered: ${event.email}`,
          `/admin/users/${event.userId}`,
          { userId: event.userId, tenantId: event.tenantId },
        );
        this.logger.debug(
          `Admin notification queued for new user: ${event.userId}`,
          'UserEventHandler',
        );
      } catch (error) {
        this.logger.error(
          `Failed to queue admin notification: ${String(error)}`,
          'UserEventHandler',
        );
      }
    }
  }

  /**
   * Handle user updated event
   * - Log the changes
   * - Send verification email on email change
   * - Send security notification on password change
   */
  @OnEvent({ event: 'UserUpdatedEvent' })
  async handleUserUpdated(event: UserUpdatedEvent): Promise<void> {
    this.logger.log(
      `User updated: ${event.userId}, changes: ${JSON.stringify(event.changes)}`,
      'UserEventHandler',
    );

    // If email was changed, send verification email
    if (event.changes.email && this.emailQueueService) {
      this.logger.log(
        `User ${event.userId} email changed to ${event.changes.email}, re-verification required`,
        'UserEventHandler',
      );
      try {
        // Generate verification token (in production, this should come from a token service)
        const verificationToken = `verify-${event.userId}-${Date.now()}`;
        await this.emailQueueService.sendVerificationEmail(event.changes.email, verificationToken);
        this.logger.debug(
          `Verification email queued for: ${event.changes.email}`,
          'UserEventHandler',
        );
      } catch (error) {
        this.logger.error(
          `Failed to queue verification email: ${String(error)}`,
          'UserEventHandler',
        );
      }
    }

    // If password was changed, send security notification
    if (event.changes.passwordChanged && this.emailQueueService) {
      this.logger.log(`User ${event.userId} password changed`, 'UserEventHandler');

      // Get email from changes or skip if not available
      // In production, you would fetch the user's email from the repository
      const userEmail = typeof event.changes.email === 'string' ? event.changes.email : null;
      if (!userEmail) {
        this.logger.warn(
          `Cannot send security notification: email not available for user ${event.userId}`,
          'UserEventHandler',
        );
        return;
      }

      try {
        await this.emailQueueService.sendNotificationEmail(
          userEmail,
          'Password Changed',
          'password-changed',
          {
            userId: event.userId,
            changedAt: new Date().toISOString(),
          },
        );
        this.logger.debug(
          `Security notification queued for user: ${event.userId}`,
          'UserEventHandler',
        );
      } catch (error) {
        this.logger.error(
          `Failed to queue security notification: ${String(error)}`,
          'UserEventHandler',
        );
      }
    }
  }

  /**
   * Handle user deleted event
   * - Log the deletion for audit trail
   * - Notify for compliance/audit
   */
  @OnEvent({ event: 'UserDeletedEvent' })
  async handleUserDeleted(event: UserDeletedEvent): Promise<void> {
    this.logger.log(
      `User deleted: ${event.userId} in tenant: ${event.tenantId} (hard delete: ${event.hardDelete})`,
      'UserEventHandler',
    );

    // Log for compliance/audit (using structured logging)
    this.logger.log(
      JSON.stringify({
        type: 'AUDIT',
        action: 'USER_DELETED',
        userId: event.userId,
        tenantId: event.tenantId,
        hardDelete: event.hardDelete,
        timestamp: new Date().toISOString(),
      }),
      'UserEventHandler:Audit',
    );

    // Notify admin about user deletion
    if (this.notificationQueueService) {
      try {
        await this.notificationQueueService.sendInAppNotification(
          'admin',
          'User Deleted',
          `User ${event.userId} has been ${event.hardDelete ? 'permanently deleted' : 'soft deleted'}`,
          `/admin/audit-log`,
          {
            userId: event.userId,
            tenantId: event.tenantId,
            hardDelete: event.hardDelete,
            deletedAt: new Date().toISOString(),
          },
        );
        this.logger.debug(
          `Deletion notification queued for user: ${event.userId}`,
          'UserEventHandler',
        );
      } catch (error) {
        this.logger.error(
          `Failed to queue deletion notification: ${String(error)}`,
          'UserEventHandler',
        );
      }
    }
  }
}
