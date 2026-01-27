import { Controller, Get, Version } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './shared/decorators';

/**
 * Root Application Controller
 *
 * Demonstrates API response format per Section 11
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * GET /api/v1
   * Root endpoint - returns app info
   *
   * Response format (Section 11.2):
   * {
   *   "success": true,
   *   "data": { "message": "...", "version": "..." }
   * }
   */
  @Get()
  @Version('1')
  getHello(): { message: string; version: string; environment: string } {
    return this.appService.getHello();
  }

  /**
   * GET /api/v1/health
   * Health check endpoint (Section 12.3)
   *
   * Public endpoint - no authentication required
   */
  @Get('health')
  @Version('1')
  @Public()
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
