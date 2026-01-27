/**
 * Health Check Result
 *
 * Section 12.3: Health Checks
 */
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Health Indicator Interface
 *
 * Port for health check implementations.
 * Each indicator checks a specific dependency or resource.
 *
 * Section 12.3: Health Checks
 */
export interface IHealthIndicator {
  /**
   * Name of the health indicator (e.g., 'database', 'redis', 'memory')
   */
  readonly name: string;

  /**
   * Check health of the resource
   */
  check(): Promise<HealthCheckResult>;

  /**
   * Whether this indicator is critical for readiness
   * Critical indicators will mark the service as not ready if unhealthy
   */
  readonly isCritical: boolean;
}

/**
 * Injection token for health indicators
 */
export const HEALTH_INDICATORS = Symbol('HEALTH_INDICATORS');
