/**
 * Retry Utilities
 *
 * Implements retry patterns from Section 12.1
 */

export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryCondition?: (error: unknown) => boolean;
}

/**
 * Default retry configurations (Section 12.1)
 */
export const RETRY_CONFIGS = {
  DATABASE: {
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 2000,
    backoffMultiplier: 2,
    jitter: false,
  },
  EXTERNAL_API: {
    maxRetries: 3,
    initialDelayMs: 500,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitter: true,
  },
  QUEUE: {
    maxRetries: 5,
    initialDelayMs: 200,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    jitter: false,
  },
  CACHE: {
    maxRetries: 2,
    initialDelayMs: 50,
    maxDelayMs: 500,
    backoffMultiplier: 2,
    jitter: false,
  },
} as const;

/**
 * Retryable error codes (Section 12.1)
 */
const RETRYABLE_ERROR_CODES = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EPIPE', 'ENOTFOUND'];

const RETRYABLE_HTTP_STATUSES = [408, 429, 500, 502, 503, 504];

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error === null || typeof error !== 'object') {
    return false;
  }

  const err = error as Record<string, unknown>;

  // Check error code
  if (typeof err.code === 'string' && RETRYABLE_ERROR_CODES.includes(err.code)) {
    return true;
  }

  // Check HTTP status
  if (typeof err.status === 'number' && RETRYABLE_HTTP_STATUSES.includes(err.status)) {
    return true;
  }

  // Check for timeout error
  if (err.name === 'TimeoutError') {
    return true;
  }

  return false;
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
export function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier = 2,
  jitter = false,
): number {
  const delay = Math.min(maxDelayMs, initialDelayMs * Math.pow(backoffMultiplier, attempt));

  if (jitter) {
    // Add random jitter: delay * (0.5 to 1.5)
    const jitterFactor = 0.5 + Math.random();
    return Math.floor(delay * jitterFactor);
  }

  return delay;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const {
    maxRetries,
    initialDelayMs,
    maxDelayMs,
    backoffMultiplier = 2,
    jitter = false,
    retryCondition = isRetryableError,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if condition not met or max retries reached
      if (attempt >= maxRetries || !retryCondition(error)) {
        throw error;
      }

      // Calculate and wait for delay
      const delay = calculateDelay(attempt, initialDelayMs, maxDelayMs, backoffMultiplier, jitter);

      await sleep(delay);
    }
  }

  throw lastError;
}
