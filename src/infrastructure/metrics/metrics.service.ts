import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as client from 'prom-client';

/**
 * Metrics Service
 *
 * Section 12.9: Production Checklist - Metrics exported (Prometheus)
 *
 * Provides Prometheus metrics collection and exposure.
 * Includes default Node.js metrics and custom application metrics.
 */
@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: client.Registry;
  private readonly prefix: string;

  // HTTP Request metrics
  public readonly httpRequestDuration: client.Histogram;
  public readonly httpRequestTotal: client.Counter;
  public readonly httpRequestErrors: client.Counter;
  public readonly httpRequestInProgress: client.Gauge;

  // Business metrics
  public readonly userOperations: client.Counter;
  public readonly authAttempts: client.Counter;
  public readonly cacheHits: client.Counter;
  public readonly cacheMisses: client.Counter;

  // Circuit breaker metrics
  public readonly circuitBreakerState: client.Gauge;
  public readonly circuitBreakerFailures: client.Counter;

  // Database metrics
  public readonly dbQueryDuration: client.Histogram;
  public readonly dbConnectionPoolSize: client.Gauge;

  constructor(private readonly configService: ConfigService) {
    this.prefix = this.configService.get<string>('app.name', 'nestjs_app').replace(/-/g, '_');
    this.registry = new client.Registry();

    // Set default labels
    this.registry.setDefaultLabels({
      app: this.prefix,
      env: this.configService.get<string>('NODE_ENV', 'development'),
    });

    // Initialize HTTP metrics
    this.httpRequestDuration = new client.Histogram({
      name: `${this.prefix}_http_request_duration_seconds`,
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.httpRequestTotal = new client.Counter({
      name: `${this.prefix}_http_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestErrors = new client.Counter({
      name: `${this.prefix}_http_request_errors_total`,
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [this.registry],
    });

    this.httpRequestInProgress = new client.Gauge({
      name: `${this.prefix}_http_requests_in_progress`,
      help: 'Number of HTTP requests currently being processed',
      labelNames: ['method', 'route'],
      registers: [this.registry],
    });

    // Initialize business metrics
    this.userOperations = new client.Counter({
      name: `${this.prefix}_user_operations_total`,
      help: 'Total number of user operations',
      labelNames: ['operation', 'status'],
      registers: [this.registry],
    });

    this.authAttempts = new client.Counter({
      name: `${this.prefix}_auth_attempts_total`,
      help: 'Total number of authentication attempts',
      labelNames: ['type', 'status'],
      registers: [this.registry],
    });

    this.cacheHits = new client.Counter({
      name: `${this.prefix}_cache_hits_total`,
      help: 'Total number of cache hits',
      labelNames: ['cache_name'],
      registers: [this.registry],
    });

    this.cacheMisses = new client.Counter({
      name: `${this.prefix}_cache_misses_total`,
      help: 'Total number of cache misses',
      labelNames: ['cache_name'],
      registers: [this.registry],
    });

    // Initialize circuit breaker metrics
    this.circuitBreakerState = new client.Gauge({
      name: `${this.prefix}_circuit_breaker_state`,
      help: 'Circuit breaker state (0=closed, 1=half-open, 2=open)',
      labelNames: ['circuit_name'],
      registers: [this.registry],
    });

    this.circuitBreakerFailures = new client.Counter({
      name: `${this.prefix}_circuit_breaker_failures_total`,
      help: 'Total number of circuit breaker failures',
      labelNames: ['circuit_name'],
      registers: [this.registry],
    });

    // Initialize database metrics
    this.dbQueryDuration = new client.Histogram({
      name: `${this.prefix}_db_query_duration_seconds`,
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry],
    });

    this.dbConnectionPoolSize = new client.Gauge({
      name: `${this.prefix}_db_connection_pool_size`,
      help: 'Current database connection pool size',
      labelNames: ['state'],
      registers: [this.registry],
    });
  }

  /**
   * Initialize default metrics collection
   */
  onModuleInit(): void {
    // Collect default Node.js metrics (memory, CPU, event loop, etc.)
    client.collectDefaultMetrics({
      register: this.registry,
      prefix: `${this.prefix}_`,
    });
  }

  /**
   * Get all metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get content type for metrics response
   */
  getContentType(): string {
    return this.registry.contentType;
  }

  /**
   * Record HTTP request start
   */
  recordRequestStart(method: string, route: string): void {
    this.httpRequestInProgress.labels(method, route).inc();
  }

  /**
   * Record HTTP request end
   */
  recordRequestEnd(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    const statusCodeStr = statusCode.toString();

    this.httpRequestInProgress.labels(method, route).dec();
    this.httpRequestDuration.labels(method, route, statusCodeStr).observe(durationSeconds);
    this.httpRequestTotal.labels(method, route, statusCodeStr).inc();

    // Track errors (4xx and 5xx)
    if (statusCode >= 400) {
      const errorType = statusCode >= 500 ? 'server_error' : 'client_error';
      this.httpRequestErrors.labels(method, route, errorType).inc();
    }
  }

  /**
   * Record user operation
   */
  recordUserOperation(operation: string, success: boolean): void {
    this.userOperations.labels(operation, success ? 'success' : 'failure').inc();
  }

  /**
   * Record authentication attempt
   */
  recordAuthAttempt(type: string, success: boolean): void {
    this.authAttempts.labels(type, success ? 'success' : 'failure').inc();
  }

  /**
   * Record cache hit
   */
  recordCacheHit(cacheName: string): void {
    this.cacheHits.labels(cacheName).inc();
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(cacheName: string): void {
    this.cacheMisses.labels(cacheName).inc();
  }

  /**
   * Record circuit breaker state
   */
  recordCircuitBreakerState(circuitName: string, state: 'closed' | 'half_open' | 'open'): void {
    const stateValue = state === 'closed' ? 0 : state === 'half_open' ? 1 : 2;
    this.circuitBreakerState.labels(circuitName).set(stateValue);
  }

  /**
   * Record circuit breaker failure
   */
  recordCircuitBreakerFailure(circuitName: string): void {
    this.circuitBreakerFailures.labels(circuitName).inc();
  }

  /**
   * Record database query duration
   */
  recordDbQueryDuration(operation: string, table: string, durationSeconds: number): void {
    this.dbQueryDuration.labels(operation, table).observe(durationSeconds);
  }

  /**
   * Update database connection pool metrics
   */
  updateDbConnectionPool(active: number, idle: number, waiting: number): void {
    this.dbConnectionPoolSize.labels('active').set(active);
    this.dbConnectionPoolSize.labels('idle').set(idle);
    this.dbConnectionPoolSize.labels('waiting').set(waiting);
  }

  /**
   * Create a custom counter
   */
  createCounter(name: string, help: string, labelNames: string[] = []): client.Counter {
    return new client.Counter({
      name: `${this.prefix}_${name}`,
      help,
      labelNames,
      registers: [this.registry],
    });
  }

  /**
   * Create a custom gauge
   */
  createGauge(name: string, help: string, labelNames: string[] = []): client.Gauge {
    return new client.Gauge({
      name: `${this.prefix}_${name}`,
      help,
      labelNames,
      registers: [this.registry],
    });
  }

  /**
   * Create a custom histogram
   */
  createHistogram(
    name: string,
    help: string,
    labelNames: string[] = [],
    buckets?: number[],
  ): client.Histogram {
    return new client.Histogram({
      name: `${this.prefix}_${name}`,
      help,
      labelNames,
      buckets: buckets || [0.01, 0.05, 0.1, 0.5, 1, 5, 10],
      registers: [this.registry],
    });
  }
}
