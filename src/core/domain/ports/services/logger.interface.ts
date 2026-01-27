/**
 * Log Level
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

/**
 * Log Context
 */
export interface LogContext {
  correlationId?: string;
  userId?: string;
  tenantId?: string;
  service?: string;
  method?: string;
  path?: string;
  [key: string]: unknown;
}

/**
 * Logger Interface
 *
 * Provides structured logging with context support.
 * Implementations handle masking of sensitive data.
 *
 * Section 7.3: Observability - Structured logging
 * Section 12.7: Observability Details - Structured log fields
 */
export interface ILogger {
  /**
   * Log message (alias for info)
   * @param message Log message
   * @param context Log context or service name
   */
  log(message: string, context?: LogContext | string): void;

  /**
   * Log error message
   * @param message Log message
   * @param context Log context or service name
   */
  error(message: string, context?: LogContext | string): void;

  /**
   * Log error message with error object
   * @param message Log message
   * @param error Error object or trace
   * @param context Log context or service name
   */
  error(message: string, error: Error | string, context?: LogContext | string): void;

  /**
   * Log warning message
   * @param message Log message
   * @param context Log context or service name
   */
  warn(message: string, context?: LogContext | string): void;

  /**
   * Log info message
   * @param message Log message
   * @param context Log context or service name
   */
  info(message: string, context?: LogContext | string): void;

  /**
   * Log debug message
   * @param message Log message
   * @param context Log context or service name
   */
  debug(message: string, context?: LogContext | string): void;

  /**
   * Log verbose message
   * @param message Log message
   * @param context Log context or service name
   */
  verbose(message: string, context?: LogContext | string): void;

  /**
   * Create a child logger with additional context
   * @param context Context to add to all logs
   */
  child(context: LogContext): ILogger;

  /**
   * Set the minimum log level
   * @param level Minimum log level
   */
  setLevel(level: LogLevel): void;
}

/**
 * Logger Token for dependency injection
 */
export const LOGGER = Symbol('LOGGER');
