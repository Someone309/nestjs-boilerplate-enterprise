import { retry, type RetryOptions, RETRY_CONFIGS, isRetryableError } from '@shared/utils';

/**
 * Retry Decorator Options
 */
export interface RetryDecoratorOptions extends Partial<RetryOptions> {
  /** Use predefined config */
  config?: keyof typeof RETRY_CONFIGS;
}

/**
 * Retry Decorator
 *
 * Automatically retries a method on failure with exponential backoff.
 *
 * Section 12.1: Resilience Patterns - Retry
 *
 * @example
 * class ExternalApiService {
 *   @Retry({ config: 'EXTERNAL_API' })
 *   async fetchData(): Promise<Data> {
 *     return this.httpClient.get('/api/data');
 *   }
 *
 *   @Retry({ maxRetries: 5, initialDelayMs: 100 })
 *   async customRetry(): Promise<Data> {
 *     return this.httpClient.post('/api/action');
 *   }
 * }
 */
export function Retry(options: RetryDecoratorOptions = {}): MethodDecorator {
  return function (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      // Build retry options
      const baseConfig = options.config ? RETRY_CONFIGS[options.config] : {};
      const retryOptions: RetryOptions = {
        maxRetries: 3,
        initialDelayMs: 100,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
        jitter: false,
        retryCondition: isRetryableError,
        ...baseConfig,
        ...options,
      };

      return retry(() => originalMethod.apply(this, args), retryOptions);
    };

    return descriptor;
  };
}
