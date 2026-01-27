import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LOGGER } from '@core/domain/ports/services';
import { LoggerService } from './logger.service';
import { LogContextService, LOG_CONTEXT } from './log-context.service';

/**
 * Logger Module
 *
 * Provides structured logging with:
 * - Sensitive data masking
 * - AsyncLocalStorage context propagation
 * - Environment-based log levels
 *
 * Global module - available everywhere.
 *
 * Section 3.1: Core Modules - LoggerModule
 * Section 12.7: Observability Details
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    LogContextService,
    {
      provide: LOG_CONTEXT,
      useExisting: LogContextService,
    },
    LoggerService,
    {
      provide: LOGGER,
      useClass: LoggerService,
    },
  ],
  exports: [LoggerService, LOGGER, LogContextService, LOG_CONTEXT],
})
export class LoggerModule {}
