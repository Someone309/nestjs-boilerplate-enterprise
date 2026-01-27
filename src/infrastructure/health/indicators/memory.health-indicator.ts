import { Injectable } from '@nestjs/common';
import { type IHealthIndicator, type HealthCheckResult } from '@core/domain/ports/services';

/**
 * Memory Health Indicator
 *
 * Checks memory usage and heap health.
 *
 * Section 12.3: Health Checks - Resource Thresholds
 * - Warning: > 70%
 * - Critical: > 85%
 */
@Injectable()
export class MemoryHealthIndicator implements IHealthIndicator {
  readonly name = 'memory';
  readonly isCritical = false;

  // Thresholds as percentages
  private readonly WARNING_THRESHOLD = 0.7; // 70%
  private readonly CRITICAL_THRESHOLD = 0.85; // 85%

  check(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const memoryUsage = process.memoryUsage();
      const heapUsed = memoryUsage.heapUsed;
      const heapTotal = memoryUsage.heapTotal;
      const rss = memoryUsage.rss;
      const external = memoryUsage.external;

      const heapUsageRatio = heapUsed / heapTotal;

      const metadata: Record<string, unknown> = {
        heapUsed: this.formatBytes(heapUsed),
        heapTotal: this.formatBytes(heapTotal),
        heapUsagePercent: Math.round(heapUsageRatio * 100),
        rss: this.formatBytes(rss),
        external: this.formatBytes(external),
      };

      const latency = Date.now() - startTime;

      if (heapUsageRatio >= this.CRITICAL_THRESHOLD) {
        return Promise.resolve({
          status: 'unhealthy',
          latency,
          message: `Heap usage critical: ${Math.round(heapUsageRatio * 100)}%`,
          metadata,
        });
      }

      if (heapUsageRatio >= this.WARNING_THRESHOLD) {
        return Promise.resolve({
          status: 'degraded',
          latency,
          message: `Heap usage high: ${Math.round(heapUsageRatio * 100)}%`,
          metadata,
        });
      }

      return Promise.resolve({
        status: 'healthy',
        latency,
        metadata,
      });
    } catch (error) {
      return Promise.resolve({
        status: 'unhealthy',
        latency: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown memory error',
      });
    }
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let value = bytes;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
  }
}
