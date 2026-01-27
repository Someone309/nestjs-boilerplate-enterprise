import { SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import type { AuditAction } from '../../domain/entities/audit-log.entity';

/**
 * Audit Options
 */
export interface AuditOptions {
  /**
   * The action being performed
   */
  action: AuditAction;

  /**
   * The type of entity being audited
   */
  entityType: string;

  /**
   * Route parameter name containing the entity ID
   */
  entityIdParam?: string;

  /**
   * Custom function to extract entity ID
   */
  entityIdExtractor?: (request: Request, response: unknown) => string | undefined;

  /**
   * Include request body in audit log
   */
  includeBody?: boolean;

  /**
   * Log failed attempts (errors)
   */
  logErrors?: boolean;

  /**
   * Additional metadata to include
   */
  metadata?: Record<string, unknown>;
}

/**
 * Metadata key for audit options
 */
export const AUDIT_OPTIONS = 'audit:options';

/**
 * Audit Decorator
 *
 * Marks an endpoint for automatic audit logging.
 *
 * @example
 * @Post()
 * @Audit({
 *   action: AuditAction.CREATE,
 *   entityType: 'User',
 *   includeBody: true,
 * })
 * async createUser(@Body() dto: CreateUserDto) { ... }
 *
 * @example
 * @Delete(':id')
 * @Audit({
 *   action: AuditAction.DELETE,
 *   entityType: 'User',
 *   entityIdParam: 'id',
 * })
 * async deleteUser(@Param('id') id: string) { ... }
 */
export const Audit = (options: AuditOptions): ReturnType<typeof SetMetadata> =>
  SetMetadata(AUDIT_OPTIONS, options);
