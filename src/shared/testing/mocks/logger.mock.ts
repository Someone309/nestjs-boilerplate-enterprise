import type { ILogger, LogContext } from '@core/domain/ports/services';

/**
 * Mock Logger for Testing
 */
export class MockLogger implements ILogger {
  log = jest.fn();
  error = jest.fn();
  warn = jest.fn();
  info = jest.fn();
  debug = jest.fn();
  verbose = jest.fn();
  setLevel = jest.fn();

  child = jest.fn().mockImplementation((_context: LogContext): ILogger => {
    return new MockLogger();
  });

  reset(): void {
    this.log.mockReset();
    this.error.mockReset();
    this.warn.mockReset();
    this.info.mockReset();
    this.debug.mockReset();
    this.verbose.mockReset();
    this.setLevel.mockReset();
    this.child.mockReset();
    // Re-setup child mock after reset
    this.child.mockImplementation((_context: LogContext): ILogger => {
      return new MockLogger();
    });
  }
}

/**
 * Create a mock logger instance
 */
export function createMockLogger(): MockLogger {
  return new MockLogger();
}
