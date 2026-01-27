import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { type IHealthIndicator, type HealthCheckResult } from '@core/domain/ports/services';

/**
 * Database Health Indicator
 *
 * Checks database connectivity and pool health.
 *
 * Section 12.3: Health Checks - Database connected
 */
@Injectable()
export class DatabaseHealthIndicator implements IHealthIndicator {
  readonly name = 'database';
  readonly isCritical = true;

  constructor(private readonly dataSource: DataSource) {}

  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      if (!this.dataSource.isInitialized) {
        return {
          status: 'unhealthy',
          latency: Date.now() - startTime,
          message: 'Database connection not initialized',
        };
      }

      // Execute a simple query to verify connectivity
      await this.dataSource.query('SELECT 1');

      const latency = Date.now() - startTime;

      // Get connection pool info if available
      const metadata: Record<string, unknown> = {};
      const driver = this.dataSource.driver;

      if ('pool' in driver) {
        const pool = driver.pool as {
          totalCount?: number;
          idleCount?: number;
          waitingCount?: number;
        };
        metadata.poolSize = pool.totalCount;
        metadata.idleConnections = pool.idleCount;
        metadata.waitingClients = pool.waitingCount;
      }

      // Check if latency is concerning
      if (latency > 1000) {
        return {
          status: 'degraded',
          latency,
          message: 'Database responding slowly',
          metadata,
        };
      }

      return {
        status: 'healthy',
        latency,
        metadata,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }
}
