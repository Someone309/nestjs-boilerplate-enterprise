/**
 * Result Type
 *
 * Represents the outcome of an operation that can succeed or fail.
 * Provides a type-safe way to handle errors without exceptions.
 *
 * Section 5.1: Required Patterns - Error handling pattern
 */
export type Result<T, E extends Error = Error> = Success<T> | Failure<E>;

/**
 * Success Result
 */
export interface Success<T> {
  readonly success: true;
  readonly value: T;
}

/**
 * Failure Result
 */
export interface Failure<E extends Error> {
  readonly success: false;
  readonly error: E;
}

/**
 * Result Factory Functions
 */
export const Result = {
  /**
   * Create a success result
   */
  ok<T>(value: T): Success<T> {
    return { success: true, value };
  },

  /**
   * Create a failure result
   */
  fail<E extends Error>(error: E): Failure<E> {
    return { success: false, error };
  },

  /**
   * Check if result is success
   */
  isSuccess<T, E extends Error>(result: Result<T, E>): result is Success<T> {
    return result.success;
  },

  /**
   * Check if result is failure
   */
  isFailure<T, E extends Error>(result: Result<T, E>): result is Failure<E> {
    return !result.success;
  },

  /**
   * Unwrap a result, throwing if it's a failure
   */
  unwrap<T, E extends Error>(result: Result<T, E>): T {
    if (result.success) {
      return result.value;
    }
    throw result.error;
  },

  /**
   * Unwrap a result with a default value
   */
  unwrapOr<T, E extends Error>(result: Result<T, E>, defaultValue: T): T {
    if (result.success) {
      return result.value;
    }
    return defaultValue;
  },

  /**
   * Map a success value to a new value
   */
  map<T, U, E extends Error>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
    if (result.success) {
      return Result.ok(fn(result.value));
    }
    return result;
  },

  /**
   * Chain results together
   */
  flatMap<T, U, E extends Error>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, E>,
  ): Result<U, E> {
    if (result.success) {
      return fn(result.value);
    }
    return result;
  },

  /**
   * Combine multiple results into one
   * Returns first failure or all successes
   */
  combine<T, E extends Error>(results: Result<T, E>[]): Result<T[], E> {
    const values: T[] = [];
    for (const result of results) {
      if (!result.success) {
        return result;
      }
      values.push(result.value);
    }
    return Result.ok(values);
  },

  /**
   * Try to execute a function and wrap in Result
   */
  try<T>(fn: () => T): Result<T> {
    try {
      return Result.ok(fn());
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  },

  /**
   * Try to execute an async function and wrap in Result
   */
  async tryAsync<T>(fn: () => Promise<T>): Promise<Result<T>> {
    try {
      return Result.ok(await fn());
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  },
};
