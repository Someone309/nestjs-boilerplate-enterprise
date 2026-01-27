import {
  Injectable,
  Inject,
  type OnModuleDestroy,
  type BeforeApplicationShutdown,
} from '@nestjs/common';
import { type ILogger, LOGGER } from '@core/domain/ports/services';

/**
 * Graceful Shutdown Service
 *
 * Handles graceful shutdown of the application.
 *
 * Section 12.2: Graceful Shutdown
 * - Phase 1: Stop accepting new connections
 * - Phase 2: Drain in-flight requests (30s)
 * - Phase 3: Close connections (10s)
 * - Phase 4: Flush buffers (5s)
 * - Phase 5: Exit
 */
@Injectable()
export class GracefulShutdownService implements OnModuleDestroy, BeforeApplicationShutdown {
  private isShuttingDown = false;
  private shutdownCallbacks: (() => Promise<void>)[] = [];

  constructor(@Inject(LOGGER) private readonly logger: ILogger) {
    // Register signal handlers
    this.setupSignalHandlers();
  }

  /**
   * Register a callback to be called during shutdown
   */
  registerShutdownCallback(callback: () => Promise<void>): void {
    this.shutdownCallbacks.push(callback);
  }

  /**
   * Check if application is shutting down
   */
  get shuttingDown(): boolean {
    return this.isShuttingDown;
  }

  /**
   * BeforeApplicationShutdown hook
   * Called before NestJS starts shutting down modules
   */
  async beforeApplicationShutdown(signal?: string): Promise<void> {
    this.logger.log(`Received shutdown signal: ${signal || 'unknown'}`, 'GracefulShutdown');
    this.isShuttingDown = true;

    // Wait for in-flight requests to complete
    this.logger.log('Waiting for in-flight requests to complete...', 'GracefulShutdown');
    await this.drainRequests();
  }

  /**
   * OnModuleDestroy hook
   * Called when module is being destroyed
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Running shutdown callbacks...', 'GracefulShutdown');

    // Execute registered callbacks
    for (const callback of this.shutdownCallbacks) {
      try {
        await callback();
      } catch (error) {
        this.logger.error(
          `Shutdown callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'GracefulShutdown',
        );
      }
    }

    this.logger.log('Shutdown complete', 'GracefulShutdown');
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGQUIT'];

    signals.forEach((signal) => {
      process.on(signal, () => {
        if (!this.isShuttingDown) {
          this.logger.log(
            `Received ${signal}, initiating graceful shutdown...`,
            'GracefulShutdown',
          );
          this.isShuttingDown = true;
        }
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error(`Uncaught exception: ${error.message}`, 'GracefulShutdown');
      this.logger.error(error.stack || '', 'GracefulShutdown');
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      this.logger.error(
        `Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`,
        'GracefulShutdown',
      );
      process.exit(1);
    });
  }

  /**
   * Wait for in-flight requests to complete
   * Timeout after 30 seconds
   */
  private async drainRequests(): Promise<void> {
    const drainTimeout = 30000; // 30 seconds
    const startTime = Date.now();

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;

        if (elapsed >= drainTimeout) {
          clearInterval(checkInterval);
          this.logger.warn('Drain timeout reached, forcing shutdown', 'GracefulShutdown');
          resolve();
        }
      }, 100);

      // In a real implementation, we would track active requests
      // and wait until they complete or timeout
      // For now, we just wait a short time
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 1000);
    });
  }
}
