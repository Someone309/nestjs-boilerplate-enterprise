import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Response } from 'express';
import { MetricsService } from './metrics.service';

/**
 * Metrics Controller
 *
 * Section 12.9: Production Checklist - Metrics exported (Prometheus)
 *
 * Exposes Prometheus metrics endpoint for scraping.
 */
@Controller('metrics')
@ApiTags('Metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Get Prometheus metrics
   *
   * Returns all collected metrics in Prometheus text format.
   * This endpoint should be scraped by Prometheus server.
   */
  @Get()
  @ApiExcludeEndpoint() // Hide from Swagger - internal use only
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({
    status: 200,
    description: 'Prometheus metrics in text format',
  })
  async getMetrics(@Res() response: Response): Promise<void> {
    const metrics = await this.metricsService.getMetrics();
    const contentType = this.metricsService.getContentType();

    response.set('Content-Type', contentType);
    response.send(metrics);
  }
}
