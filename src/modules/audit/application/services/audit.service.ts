import { Injectable, Inject } from '@nestjs/common';
import { type ILogger, LOGGER } from '@core/domain/ports/services';
import { generateUUID } from '@shared/utils';
import { AuditLog, AuditAction, type AuditLogProps } from '../../domain/entities/audit-log.entity';
import {
  type IAuditLogRepository,
  AUDIT_LOG_REPOSITORY,
  type AuditLogFilter,
} from '../../domain/repositories/audit-log.repository.interface';
import type {
  PaginationParams,
  PaginatedResult,
  SortParams,
} from '@core/domain/ports/repositories';

/**
 * Audit Context
 * Information about the current request context
 */
export interface AuditContext {
  userId?: string;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create Audit Log Input
 */
export interface CreateAuditLogInput {
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Audit Service
 *
 * Application service for creating and querying audit logs.
 * Used by interceptors, event handlers, and explicit service calls.
 *
 * Section 3.3: Optional Feature Modules - AuditModule
 */
@Injectable()
export class AuditService {
  constructor(
    @Inject(LOGGER) private readonly logger: ILogger,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  /**
   * Create an audit log entry
   */
  async log(input: CreateAuditLogInput, context?: AuditContext): Promise<AuditLog> {
    const props: AuditLogProps = {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      userId: context?.userId,
      tenantId: context?.tenantId,
      oldValues: input.oldValues,
      newValues: input.newValues,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      metadata: input.metadata,
    };

    const auditLog = AuditLog.create(generateUUID(), props);

    try {
      return await this.auditLogRepository.create(auditLog);
    } catch (error) {
      // Log error but don't throw - audit logging should not break the main flow
      this.logger.error('Failed to create audit log', error as Error, {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
      });
      return auditLog;
    }
  }

  /**
   * Log entity creation
   */
  async logCreate(
    entityType: string,
    entityId: string,
    newValues: Record<string, unknown>,
    context?: AuditContext,
    metadata?: Record<string, unknown>,
  ): Promise<AuditLog> {
    return this.log(
      {
        action: AuditAction.CREATE,
        entityType,
        entityId,
        newValues: this.sanitizeValues(newValues),
        metadata,
      },
      context,
    );
  }

  /**
   * Log entity update
   */
  async logUpdate(
    entityType: string,
    entityId: string,
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>,
    context?: AuditContext,
    metadata?: Record<string, unknown>,
  ): Promise<AuditLog> {
    return this.log(
      {
        action: AuditAction.UPDATE,
        entityType,
        entityId,
        oldValues: this.sanitizeValues(oldValues),
        newValues: this.sanitizeValues(newValues),
        metadata,
      },
      context,
    );
  }

  /**
   * Log entity deletion
   */
  async logDelete(
    entityType: string,
    entityId: string,
    oldValues: Record<string, unknown>,
    context?: AuditContext,
    metadata?: Record<string, unknown>,
  ): Promise<AuditLog> {
    return this.log(
      {
        action: AuditAction.DELETE,
        entityType,
        entityId,
        oldValues: this.sanitizeValues(oldValues),
        metadata,
      },
      context,
    );
  }

  /**
   * Log user login
   */
  async logLogin(
    userId: string,
    context?: AuditContext,
    metadata?: Record<string, unknown>,
  ): Promise<AuditLog> {
    return this.log(
      {
        action: AuditAction.LOGIN,
        entityType: 'User',
        entityId: userId,
        metadata,
      },
      { ...context, userId },
    );
  }

  /**
   * Log user logout
   */
  async logLogout(
    userId: string,
    context?: AuditContext,
    metadata?: Record<string, unknown>,
  ): Promise<AuditLog> {
    return this.log(
      {
        action: AuditAction.LOGOUT,
        entityType: 'User',
        entityId: userId,
        metadata,
      },
      { ...context, userId },
    );
  }

  /**
   * Query audit logs
   */
  async findMany(
    filter: AuditLogFilter,
    pagination?: PaginationParams,
    sort?: SortParams,
  ): Promise<PaginatedResult<AuditLog>> {
    return this.auditLogRepository.findMany(filter, pagination, sort);
  }

  /**
   * Get audit history for an entity
   */
  async getEntityHistory(
    entityType: string,
    entityId: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<AuditLog>> {
    return this.auditLogRepository.findByEntity(entityType, entityId, pagination);
  }

  /**
   * Get audit history for a user
   */
  async getUserHistory(
    userId: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<AuditLog>> {
    return this.auditLogRepository.findByUser(userId, pagination);
  }

  /**
   * Sanitize values to remove sensitive data
   */
  private sanitizeValues(values: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
      'creditCard',
      'ssn',
    ];

    const sanitized = { ...values };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
