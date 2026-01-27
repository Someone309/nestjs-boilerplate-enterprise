import { Global, Module } from '@nestjs/common';
import { GracefulShutdownService } from './graceful-shutdown.service';

/**
 * Shutdown Module
 *
 * Provides graceful shutdown functionality.
 *
 * Section 12.2: Graceful Shutdown
 */
@Global()
@Module({
  providers: [GracefulShutdownService],
  exports: [GracefulShutdownService],
})
export class ShutdownModule {}
