/**
 * Timeout Error
 */
export class TimeoutError extends Error {
  constructor(
    public readonly timeoutMs: number,
    public readonly operationName: string,
  ) {
    super(`Operation '${operationName}' timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Timeout Decorator Options
 */
export interface TimeoutDecoratorOptions {
  /** Timeout in milliseconds */
  ms: number;
}

/**
 * Create a promise that rejects after timeout
 */
function createTimeoutPromise(ms: number, operationName: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(ms, operationName));
    }, ms);
  });
}

/**
 * Timeout Decorator
 *
 * Adds a timeout to async methods.
 *
 * Section 12.1: Resilience Patterns - Timeout
 *
 * @example
 * class ExternalApiService {
 *   @Timeout({ ms: 5000 })
 *   async fetchData(): Promise<Data> {
 *     return this.httpClient.get('/api/data');
 *   }
 *
 *   @Timeout({ ms: 30000 }) // 30 seconds for slow operations
 *   async processReport(): Promise<Report> {
 *     return this.reportService.generate();
 *   }
 * }
 */
export function Timeout(options: TimeoutDecoratorOptions): MethodDecorator {
  return function (
    _target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    const operationName = String(propertyKey);

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      const timeoutPromise = createTimeoutPromise(options.ms, operationName);
      const originalPromise = originalMethod.apply(this, args);

      return Promise.race([originalPromise, timeoutPromise]);
    };

    return descriptor;
  };
}

/**
 * Default timeout values (Section 12.1)
 */
export const TIMEOUT_DEFAULTS = {
  READ_QUERY: 5000, // 5 seconds
  WRITE_QUERY: 10000, // 10 seconds
  EXTERNAL_API: 10000, // 10 seconds
  REPORT: 60000, // 60 seconds
  MIGRATION: 300000, // 5 minutes
} as const;
