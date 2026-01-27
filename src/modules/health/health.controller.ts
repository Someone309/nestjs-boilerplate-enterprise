import { Controller, Get, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '@shared/decorators';
import {
  HealthService,
  type HealthResponse,
  type DeepHealthResponse,
} from '@infrastructure/health';

/**
 * Health Controller
 *
 * Provides health check endpoints for Kubernetes probes and monitoring.
 *
 * Section 12.3: Health Checks
 * - /health/live - Liveness probe (is process alive?)
 * - /health/ready - Readiness probe (ready to serve traffic?)
 * - /health/startup - Startup probe (initial startup complete?)
 * - /health/deep - Deep health check (internal monitoring)
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Liveness Probe
   * GET /health/live
   *
   * Kubernetes livenessProbe - checks if process is alive.
   * If this fails, Kubernetes will restart the container.
   *
   * Response time should be < 1s
   */
  @Get('live')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Check if process is alive. Used by Kubernetes livenessProbe.',
  })
  @ApiResponse({
    status: 200,
    description: 'Process is alive',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', example: '2026-01-15T10:30:00.000Z' },
        uptime: { type: 'number', example: 3600 },
      },
    },
  })
  live(): { status: 'healthy'; timestamp: string; uptime: number } {
    return this.healthService.checkLiveness();
  }

  /**
   * Readiness Probe
   * GET /health/ready
   *
   * Kubernetes readinessProbe - checks if ready to serve traffic.
   * If this fails, Kubernetes removes pod from load balancer.
   *
   * Checks critical dependencies: database, cache, etc.
   */
  @Get('ready')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Check if service is ready to serve traffic. Used by Kubernetes readinessProbe.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is ready',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'degraded'] },
        timestamp: { type: 'string' },
        uptime: { type: 'number' },
        checks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              status: { type: 'string' },
              latency: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready(): Promise<HealthResponse> {
    const response = await this.healthService.checkReadiness();

    if (response.status === 'unhealthy') {
      throw new HttpException(response, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return response;
  }

  /**
   * Startup Probe
   * GET /health/startup
   *
   * Kubernetes startupProbe - checks if initial startup is complete.
   * Allows slow starting containers to complete initialization.
   */
  @Get('startup')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Startup probe',
    description: 'Check if initial startup is complete. Used by Kubernetes startupProbe.',
  })
  @ApiResponse({
    status: 200,
    description: 'Startup status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'unhealthy'] },
        timestamp: { type: 'string' },
        startupComplete: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'Startup not complete' })
  startup(): { status: 'healthy' | 'unhealthy'; timestamp: string; startupComplete: boolean } {
    const response = this.healthService.checkStartup();

    if (response.status === 'unhealthy') {
      throw new HttpException(response, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return response;
  }

  /**
   * Deep Health Check
   * GET /health/deep
   *
   * Detailed health check for internal monitoring.
   * Checks all dependencies and returns detailed system info.
   *
   * Note: In production, this should be protected with authentication
   * or restricted to internal networks only.
   */
  @Get('deep')
  @Public() // In production, consider using @UseGuards(InternalOnlyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deep health check',
    description:
      'Detailed health check for internal monitoring. Returns comprehensive system and dependency status.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Deep health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
        timestamp: { type: 'string' },
        uptime: { type: 'number' },
        version: { type: 'string' },
        checks: { type: 'array' },
        system: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            nodeVersion: { type: 'string' },
            processId: { type: 'number' },
            hostname: { type: 'string' },
          },
        },
      },
    },
  })
  async deep(): Promise<DeepHealthResponse> {
    return this.healthService.checkDeepHealth();
  }
}
