import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { MetricsInterceptor } from './metrics.interceptor';
import { TracingService } from './tracing.service';

/**
 * Metrics Module
 *
 * Section 12.9: Production Checklist - Observability
 *
 * Provides:
 * - Prometheus metrics collection and exposure
 * - OpenTelemetry distributed tracing
 * - Automatic HTTP request metrics via interceptor
 *
 * Features:
 * - Default Node.js metrics (memory, CPU, event loop)
 * - HTTP request duration, count, errors
 * - Business metrics (user operations, auth attempts)
 * - Cache hit/miss metrics
 * - Circuit breaker metrics
 * - Database query metrics
 * - Custom metric creation helpers
 */
@Global()
@Module({
  controllers: [MetricsController],
  providers: [
    MetricsService,
    TracingService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
  exports: [MetricsService, TracingService],
})
export class MetricsModule {}
