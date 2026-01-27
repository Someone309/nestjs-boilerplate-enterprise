import type {
  PaginationParams,
  PaginatedResult,
  SortParams,
} from '@core/domain/ports/repositories';
import type { AuditLog, AuditAction } from '../entities/audit-log.entity';

/**
 * Audit Log Filter Criteria
 */
export interface AuditLogFilter {
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  userId?: string;
  tenantId?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Audit Log Repository Interface
 *
 * Specialized repository for audit logs.
 * Optimized for high-volume inserts and time-based queries.
 */
export interface IAuditLogRepository {
  /**
   * Create a new audit log entry
   */
  create(auditLog: AuditLog): Promise<AuditLog>;

  /**
   * Create multiple audit log entries (batch insert)
   */
  createMany(auditLogs: AuditLog[]): Promise<void>;

  /**
   * Find audit logs by filter with pagination
   */
  findMany(
    filter: AuditLogFilter,
    pagination?: PaginationParams,
    sort?: SortParams,
  ): Promise<PaginatedResult<AuditLog>>;

  /**
   * Find audit logs for a specific entity
   */
  findByEntity(
    entityType: string,
    entityId: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<AuditLog>>;

  /**
   * Find audit logs for a specific user
   */
  findByUser(userId: string, pagination?: PaginationParams): Promise<PaginatedResult<AuditLog>>;

  /**
   * Count audit logs by filter
   */
  count(filter: AuditLogFilter): Promise<number>;

  /**
   * Delete old audit logs (for retention policy)
   */
  deleteOlderThan(date: Date): Promise<number>;
}

/**
 * Audit Log Repository Token
 */
export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');
