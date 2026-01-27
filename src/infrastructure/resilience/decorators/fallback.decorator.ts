/**
 * Fallback Decorator Options
 */
export interface FallbackDecoratorOptions<T> {
  /** Static fallback value */
  value?: T;
  /** Fallback method name on the same class */
  method?: string;
  /** Fallback factory function */
  factory?: (error: unknown, ...args: unknown[]) => T | Promise<T>;
  /** Only apply fallback for specific error types */
  when?: (error: unknown) => boolean;
}

/**
 * Fallback Decorator
 *
 * Provides graceful degradation when a method fails.
 *
 * Section 12.1: Resilience Patterns - Fallback
 *
 * @example
 * class UserService {
 *   // Return static value on failure
 *   @Fallback({ value: [] })
 *   async getRecommendations(userId: string): Promise<User[]> {
 *     return this.aiService.recommend(userId);
 *   }
 *
 *   // Call another method on failure
 *   @Fallback({ method: 'getCachedProfile' })
 *   async getProfile(userId: string): Promise<Profile> {
 *     return this.apiService.getProfile(userId);
 *   }
 *
 *   // Factory function for dynamic fallback
 *   @Fallback({
 *     factory: (error, userId) => ({ id: userId, name: 'Unknown', cached: true })
 *   })
 *   async getUserDetails(userId: string): Promise<UserDetails> {
 *     return this.externalApi.getUser(userId);
 *   }
 * }
 */
export function Fallback<T>(options: FallbackDecoratorOptions<T>): MethodDecorator {
  return function (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Check if we should apply fallback
        if (options.when && !options.when(error)) {
          throw error;
        }

        // Try fallback method
        if (options.method) {
          const fallbackMethod = (this as Record<string, unknown>)[options.method];
          if (typeof fallbackMethod === 'function') {
            return fallbackMethod.apply(this, args) as unknown;
          }
        }

        // Try factory function
        if (options.factory) {
          return options.factory(error, ...args);
        }

        // Return static value
        if ('value' in options) {
          return options.value;
        }

        // No fallback configured, rethrow
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Fallback to cache decorator
 *
 * Convenience decorator that falls back to a cached value.
 *
 * @example
 * class DataService {
 *   @FallbackToCache('getDataFromCache')
 *   async getData(key: string): Promise<Data> {
 *     return this.apiService.fetchData(key);
 *   }
 *
 *   async getDataFromCache(key: string): Promise<Data> {
 *     return this.cacheService.get(key);
 *   }
 * }
 */
export function FallbackToCache(cacheMethodName: string): MethodDecorator {
  return Fallback({ method: cacheMethodName });
}

/**
 * Fallback to default value decorator
 *
 * @example
 * class ConfigService {
 *   @FallbackToDefault({ theme: 'light', language: 'en' })
 *   async getUserPreferences(userId: string): Promise<Preferences> {
 *     return this.preferencesApi.get(userId);
 *   }
 * }
 */
export function FallbackToDefault(defaultValue: unknown): MethodDecorator {
  return Fallback({ value: defaultValue });
}
