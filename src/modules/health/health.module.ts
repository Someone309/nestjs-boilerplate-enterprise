import { Module, type OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import {
  HealthService,
  DatabaseHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@infrastructure/health';
import { HEALTH_INDICATORS } from '@core/domain/ports/services';

/**
 * Health Module
 *
 * Provides health check endpoints for production readiness.
 *
 * Section 12.3: Health Checks
 * - /health/live - Liveness probe
 * - /health/ready - Readiness probe
 * - /health/startup - Startup probe
 * - /health/deep - Deep health check (internal)
 */
@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [HealthController],
  providers: [
    HealthService,
    DatabaseHealthIndicator,
    MemoryHealthIndicator,
    DiskHealthIndicator,
    {
      provide: HEALTH_INDICATORS,
      useFactory: (
        database: DatabaseHealthIndicator,
        memory: MemoryHealthIndicator,
        disk: DiskHealthIndicator,
      ) => [database, memory, disk],
      inject: [DatabaseHealthIndicator, MemoryHealthIndicator, DiskHealthIndicator],
    },
  ],
  exports: [HealthService],
})
export class HealthModule implements OnModuleInit {
  constructor(private readonly healthService: HealthService) {}

  onModuleInit(): void {
    // Mark startup complete after a brief delay for all dependencies to initialize
    setTimeout(() => {
      this.healthService.markStartupComplete();
    }, 2000);
  }
}
