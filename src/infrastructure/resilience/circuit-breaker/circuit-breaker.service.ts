import { Injectable, Inject } from '@nestjs/common';
import { LOGGER, type ILogger } from '@core/domain/ports/services';

/**
 * Circuit Breaker State
 *
 * Section 12.1: Circuit Breaker States
 */
export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing fast
  HALF_OPEN = 'HALF_OPEN', // Testing recovery
}

/**
 * Circuit Breaker Options
 */
export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time in ms before attempting recovery (half-open) */
  resetTimeout: number;
  /** Number of successful calls in half-open to close circuit */
  successThreshold: number;
  /** Optional name for logging */
  name?: string;
}

/**
 * Circuit Breaker Statistics
 */
export interface CircuitStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure?: Date;
  lastSuccess?: Date;
  openedAt?: Date;
}

/**
 * Circuit Breaker Error
 */
export class CircuitBreakerOpenError extends Error {
  constructor(
    public readonly circuitName: string,
    public readonly remainingTime: number,
  ) {
    super(`Circuit breaker '${circuitName}' is open. Retry after ${remainingTime}ms`);
    this.name = 'CircuitBreakerOpenError';
  }
}

/**
 * Default circuit breaker options
 */
const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  successThreshold: 2,
  name: 'default',
};

/**
 * Individual Circuit Breaker instance
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private lastFailure?: Date;
  private lastSuccess?: Date;
  private openedAt?: Date;

  constructor(
    private readonly options: CircuitBreakerOptions,
    private readonly logger?: ILogger,
  ) {}

  get stats(): CircuitStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
      openedAt: this.openedAt,
    };
  }

  /**
   * Execute a function through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.checkState();

    if (this.state === CircuitState.OPEN) {
      const remainingTime = this.getRemainingResetTime();
      throw new CircuitBreakerOpenError(this.options.name || 'unknown', remainingTime);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Check and potentially transition state
   */
  private checkState(): void {
    if (this.state === CircuitState.OPEN && this.shouldAttemptReset()) {
      this.transitionTo(CircuitState.HALF_OPEN);
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.lastSuccess = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;

      if (this.successes >= this.options.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else {
      // Reset failure count on success in closed state
      this.failures = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.lastFailure = new Date();
    this.failures++;

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open goes back to open
      this.transitionTo(CircuitState.OPEN);
    } else if (this.failures >= this.options.failureThreshold) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  /**
   * Check if we should attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.openedAt) {
      return false;
    }
    return Date.now() - this.openedAt.getTime() >= this.options.resetTimeout;
  }

  /**
   * Get remaining time before reset attempt
   */
  private getRemainingResetTime(): number {
    if (!this.openedAt) {
      return 0;
    }
    const elapsed = Date.now() - this.openedAt.getTime();
    return Math.max(0, this.options.resetTimeout - elapsed);
  }

  /**
   * Transition to new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    this.logger?.info(`Circuit '${this.options.name}' transitioned: ${oldState} -> ${newState}`, {
      service: 'CircuitBreaker',
      circuit: this.options.name,
      oldState,
      newState,
      failures: this.failures,
      successes: this.successes,
    });

    if (newState === CircuitState.OPEN) {
      this.openedAt = new Date();
      this.successes = 0;
    } else if (newState === CircuitState.CLOSED) {
      this.failures = 0;
      this.successes = 0;
      this.openedAt = undefined;
    } else if (newState === CircuitState.HALF_OPEN) {
      this.successes = 0;
    }
  }

  /**
   * Force close the circuit (for testing/admin)
   */
  forceClose(): void {
    this.transitionTo(CircuitState.CLOSED);
  }

  /**
   * Force open the circuit (for testing/admin)
   */
  forceOpen(): void {
    this.transitionTo(CircuitState.OPEN);
  }
}

/**
 * Circuit Breaker Service
 *
 * Manages multiple circuit breakers for different services.
 *
 * Section 12.1: Resilience Patterns - Circuit Breaker
 */
@Injectable()
export class CircuitBreakerService {
  private readonly circuits = new Map<string, CircuitBreaker>();

  constructor(
    @Inject(LOGGER)
    private readonly logger: ILogger,
  ) {}

  /**
   * Get or create a circuit breaker
   */
  getCircuit(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
    let circuit = this.circuits.get(name);
    if (!circuit) {
      const circuitOptions = { ...DEFAULT_OPTIONS, ...options, name };
      circuit = new CircuitBreaker(circuitOptions, this.logger);
      this.circuits.set(name, circuit);
    }
    return circuit;
  }

  /**
   * Execute a function through a named circuit breaker
   */
  async execute<T>(
    name: string,
    fn: () => Promise<T>,
    options?: Partial<CircuitBreakerOptions>,
  ): Promise<T> {
    const circuit = this.getCircuit(name, options);
    return circuit.execute(fn);
  }

  /**
   * Get stats for all circuits
   */
  getAllStats(): Record<string, CircuitStats> {
    const stats: Record<string, CircuitStats> = {};
    this.circuits.forEach((circuit, name) => {
      stats[name] = circuit.stats;
    });
    return stats;
  }

  /**
   * Get stats for a specific circuit
   */
  getStats(name: string): CircuitStats | undefined {
    return this.circuits.get(name)?.stats;
  }

  /**
   * Force close a circuit
   */
  forceClose(name: string): void {
    this.circuits.get(name)?.forceClose();
  }

  /**
   * Force open a circuit
   */
  forceOpen(name: string): void {
    this.circuits.get(name)?.forceOpen();
  }
}
