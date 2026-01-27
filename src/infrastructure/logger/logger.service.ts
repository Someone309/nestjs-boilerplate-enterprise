import { Injectable, Logger as NestLogger, Scope, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ILogger, LogContext, LogLevel } from '@core/domain/ports/services';
import { maskSensitiveData } from '@shared/utils';
import { LogContextService, LOG_CONTEXT } from './log-context.service';

/**
 * Logger Service Implementation
 *
 * Wraps NestJS Logger with structured logging, sensitive data masking,
 * and automatic context propagation via AsyncLocalStorage.
 *
 * Section 12.7: Observability Details
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements ILogger {
  private readonly logger: NestLogger;
  private context: LogContext = {};
  private minLevel: LogLevel = 'info';

  private readonly levelPriority: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    verbose: 4,
  };

  constructor(
    private readonly configService: ConfigService,
    @Optional()
    @Inject(LOG_CONTEXT)
    private readonly logContextService?: LogContextService,
  ) {
    this.logger = new NestLogger('Application');

    const nodeEnv = this.configService.get<string>('app.nodeEnv', 'development');

    // Set log level based on environment (Section 12.7)
    if (nodeEnv === 'production') {
      this.minLevel = 'info';
    } else if (nodeEnv === 'staging') {
      this.minLevel = 'debug';
    } else {
      this.minLevel = 'verbose';
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] <= this.levelPriority[this.minLevel];
  }

  private normalizeContext(contextOrService?: LogContext | string): LogContext {
    if (!contextOrService) {
      return {};
    }
    if (typeof contextOrService === 'string') {
      return { service: contextOrService };
    }
    return contextOrService;
  }

  /**
   * Get context from AsyncLocalStorage
   */
  private getAsyncContext(): LogContext {
    if (!this.logContextService) {
      return {};
    }

    const asyncContext = this.logContextService.getContext();
    if (!asyncContext) {
      return {};
    }

    return {
      correlationId: asyncContext.correlationId,
      userId: asyncContext.userId,
      tenantId: asyncContext.tenantId,
    };
  }

  private formatMessage(message: string, context?: LogContext | string): string {
    const normalizedContext = this.normalizeContext(context);
    const asyncContext = this.getAsyncContext();

    // Merge contexts: async context < instance context < call context
    const mergedContext = {
      ...asyncContext,
      ...this.context,
      ...normalizedContext,
    };

    const maskedContext = maskSensitiveData(mergedContext);

    // Structured log format (Section 12.7)
    const logData = {
      timestamp: new Date().toISOString(),
      message,
      ...maskedContext,
    };

    return JSON.stringify(logData);
  }

  log(message: string, context?: LogContext | string): void {
    this.info(message, context);
  }

  error(
    message: string,
    errorOrContext?: Error | string | LogContext,
    context?: LogContext | string,
  ): void {
    if (!this.shouldLog('error')) {
      return;
    }

    if (errorOrContext instanceof Error) {
      const errorContext = {
        ...this.normalizeContext(context),
        error: {
          name: errorOrContext.name,
          message: errorOrContext.message,
          stack: errorOrContext.stack,
        },
      };
      this.logger.error(this.formatMessage(message, errorContext));
    } else if (typeof errorOrContext === 'string' && context === undefined) {
      // errorOrContext is the service name
      this.logger.error(this.formatMessage(message, errorOrContext));
    } else if (typeof errorOrContext === 'string') {
      // errorOrContext is a stack trace
      const errorContext = {
        ...this.normalizeContext(context),
        stack: errorOrContext,
      };
      this.logger.error(this.formatMessage(message, errorContext));
    } else {
      this.logger.error(this.formatMessage(message, errorOrContext));
    }
  }

  warn(message: string, context?: LogContext | string): void {
    if (!this.shouldLog('warn')) {
      return;
    }
    this.logger.warn(this.formatMessage(message, context));
  }

  info(message: string, context?: LogContext | string): void {
    if (!this.shouldLog('info')) {
      return;
    }
    this.logger.log(this.formatMessage(message, context));
  }

  debug(message: string, context?: LogContext | string): void {
    if (!this.shouldLog('debug')) {
      return;
    }
    this.logger.debug(this.formatMessage(message, context));
  }

  verbose(message: string, context?: LogContext | string): void {
    if (!this.shouldLog('verbose')) {
      return;
    }
    this.logger.verbose(this.formatMessage(message, context));
  }

  child(context: LogContext): ILogger {
    const childLogger = new LoggerService(this.configService, this.logContextService);
    childLogger.context = { ...this.context, ...context };
    childLogger.minLevel = this.minLevel;
    return childLogger;
  }

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}
