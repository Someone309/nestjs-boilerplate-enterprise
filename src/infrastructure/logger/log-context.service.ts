import { Injectable, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * Log Context Data
 *
 * Section 12.7: Structured Log Fields
 */
export interface LogContextData {
  correlationId?: string;
  userId?: string;
  tenantId?: string;
  service?: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: unknown;
}

/**
 * Log Context Service
 *
 * Uses AsyncLocalStorage to propagate context through async operations.
 * This allows any code in the request chain to access correlation ID,
 * user ID, tenant ID without explicit parameter passing.
 *
 * Section 12.7: Correlation ID Propagation
 */
@Injectable({ scope: Scope.DEFAULT })
export class LogContextService {
  private readonly storage = new AsyncLocalStorage<LogContextData>();

  /**
   * Run a function within a log context
   * All async operations within this function will have access to the context
   */
  run<T>(context: LogContextData, fn: () => T): T {
    return this.storage.run(context, fn);
  }

  /**
   * Run an async function within a log context
   */
  async runAsync<T>(context: LogContextData, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.storage.run(context, () => {
        fn().then(resolve).catch(reject);
      });
    });
  }

  /**
   * Get the current context
   */
  getContext(): LogContextData | undefined {
    return this.storage.getStore();
  }

  /**
   * Get a specific value from the current context
   */
  get<K extends keyof LogContextData>(key: K): LogContextData[K] | undefined {
    const store = this.storage.getStore();
    return store?.[key];
  }

  /**
   * Get correlation ID from current context
   */
  getCorrelationId(): string | undefined {
    return this.get('correlationId');
  }

  /**
   * Get user ID from current context
   */
  getUserId(): string | undefined {
    return this.get('userId');
  }

  /**
   * Get tenant ID from current context
   */
  getTenantId(): string | undefined {
    return this.get('tenantId');
  }

  /**
   * Update the current context with additional data
   * Returns new merged context
   */
  extend(data: Partial<LogContextData>): LogContextData {
    const current = this.getContext() || {};
    return { ...current, ...data };
  }

  /**
   * Set a value in the current context
   * Note: This mutates the current store, use with caution
   */
  set<K extends keyof LogContextData>(key: K, value: LogContextData[K]): void {
    const store = this.storage.getStore();
    if (store) {
      store[key] = value;
    }
  }

  /**
   * Create a child context with additional data
   * Useful for creating sub-contexts in nested operations
   */
  child(data: Partial<LogContextData>): LogContextData {
    const current = this.getContext() || {};
    return { ...current, ...data };
  }
}

/**
 * Injection token for LogContextService
 */
export const LOG_CONTEXT = Symbol('LOG_CONTEXT');
