import { Module, type DynamicModule, Global, type InjectionToken } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './application/services/audit.service';
import { AuditLogEntity } from './infrastructure/entities/audit-log.typeorm.entity';
import { AuditLogRepository } from './infrastructure/repositories/audit-log.repository';
import { AUDIT_LOG_REPOSITORY } from './domain/repositories/audit-log.repository.interface';
import { AuditController } from './presentation/controllers/audit.controller';
import { AuditInterceptor } from './infrastructure/interceptors/audit.interceptor';

/**
 * Audit Module Options
 */
export interface AuditModuleOptions {
  /**
   * Enable audit controller (REST API for querying logs)
   * @default true
   */
  enableController?: boolean;

  /**
   * Enable global audit interceptor
   * @default false
   */
  enableGlobalInterceptor?: boolean;

  /**
   * Retention period in days (for automatic cleanup)
   * @default 730 (2 years)
   */
  retentionDays?: number;
}

/**
 * Audit Module
 *
 * Provides audit logging functionality for compliance and debugging.
 *
 * Features:
 * - Automatic audit logging via @Audit() decorator
 * - Manual audit logging via AuditService
 * - Query API for audit history
 * - Configurable retention policy
 *
 * Section 3.3: Optional Feature Modules - AuditModule
 *
 * @example
 * // In AppModule
 * @Module({
 *   imports: [
 *     AuditModule.forRoot({
 *       enableController: true,
 *       enableGlobalInterceptor: false,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * @example
 * // In a controller
 * @Post()
 * @Audit({ action: AuditAction.CREATE, entityType: 'User' })
 * async createUser() { ... }
 *
 * @example
 * // Manual logging
 * await this.auditService.logCreate('User', user.id, user, context);
 */
@Global()
@Module({})
export class AuditModule {
  static forRoot(options: AuditModuleOptions = {}): DynamicModule {
    const { enableController = true } = options;

    const controllers = enableController ? [AuditController] : [];

    return {
      module: AuditModule,
      imports: [TypeOrmModule.forFeature([AuditLogEntity])],
      controllers,
      providers: [
        AuditService,
        AuditInterceptor,
        {
          provide: AUDIT_LOG_REPOSITORY,
          useClass: AuditLogRepository,
        },
        {
          provide: 'AUDIT_OPTIONS',
          useValue: options,
        },
      ],
      exports: [AuditService, AuditInterceptor, AUDIT_LOG_REPOSITORY],
    };
  }

  static forRootAsync(options: {
    useFactory: (...args: unknown[]) => Promise<AuditModuleOptions> | AuditModuleOptions;
    inject?: InjectionToken[];
  }): DynamicModule {
    return {
      module: AuditModule,
      imports: [TypeOrmModule.forFeature([AuditLogEntity])],
      controllers: [AuditController],
      providers: [
        AuditService,
        AuditInterceptor,
        {
          provide: AUDIT_LOG_REPOSITORY,
          useClass: AuditLogRepository,
        },
        {
          provide: 'AUDIT_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ],
      exports: [AuditService, AuditInterceptor, AUDIT_LOG_REPOSITORY],
    };
  }
}
