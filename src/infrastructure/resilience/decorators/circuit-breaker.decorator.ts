import { Inject } from '@nestjs/common';
import {
  CircuitBreakerService,
  type CircuitBreakerOptions,
} from '../circuit-breaker/circuit-breaker.service';

/**
 * Circuit Breaker Decorator Options
 */
export interface CircuitBreakerDecoratorOptions extends Partial<CircuitBreakerOptions> {
  /** Circuit name (defaults to class.method) */
  name?: string;
}

/**
 * Symbol for storing circuit breaker service
 */
const CIRCUIT_BREAKER_SERVICE = Symbol('CircuitBreakerService');

/**
 * Circuit Breaker Decorator
 *
 * Wraps a method with circuit breaker protection.
 *
 * Section 12.1: Resilience Patterns - Circuit Breaker
 *
 * NOTE: This decorator requires the class to have CircuitBreakerService injected.
 * Use @InjectCircuitBreaker() on the constructor parameter.
 *
 * @example
 * class PaymentService {
 *   constructor(
 *     @InjectCircuitBreaker() private circuitBreaker: CircuitBreakerService,
 *   ) {}
 *
 *   @CircuitBreaker({ failureThreshold: 3, resetTimeout: 30000 })
 *   async processPayment(data: PaymentDto): Promise<PaymentResult> {
 *     return this.paymentGateway.process(data);
 *   }
 * }
 */
export function CircuitBreaker(options: CircuitBreakerDecoratorOptions = {}): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    const className = target.constructor.name;
    const circuitName = options.name || `${className}.${String(propertyKey)}`;

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      // Get circuit breaker service from instance
      const service = (this as Record<string | symbol, unknown>)[
        CIRCUIT_BREAKER_SERVICE
      ] as CircuitBreakerService;

      if (!service) {
        // Fallback: execute without circuit breaker
        console.warn(
          `CircuitBreakerService not found for ${circuitName}. Use @InjectCircuitBreaker() decorator.`,
        );
        return originalMethod.apply(this, args);
      }

      return service.execute(circuitName, () => originalMethod.apply(this, args), {
        failureThreshold: options.failureThreshold,
        resetTimeout: options.resetTimeout,
        successThreshold: options.successThreshold,
      });
    };

    return descriptor;
  };
}

/**
 * Inject Circuit Breaker Service decorator
 *
 * Use this on constructor parameter to enable @CircuitBreaker decorator.
 *
 * @example
 * constructor(
 *   @InjectCircuitBreaker() private circuitBreaker: CircuitBreakerService,
 * ) {}
 */
export function InjectCircuitBreaker(): ParameterDecorator {
  return function (
    target: object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) {
    // Apply NestJS Inject decorator
    Inject(CircuitBreakerService)(target, propertyKey, parameterIndex);

    // Mark this parameter as circuit breaker service
    Reflect.defineMetadata(CIRCUIT_BREAKER_SERVICE, parameterIndex, target);
  };
}

/**
 * Default circuit breaker configurations
 */
export const CIRCUIT_BREAKER_CONFIGS = {
  /** For external APIs - moderate protection */
  EXTERNAL_API: {
    failureThreshold: 5,
    resetTimeout: 30000, // 30 seconds
    successThreshold: 2,
  },
  /** For payment gateways - strict protection */
  PAYMENT: {
    failureThreshold: 3,
    resetTimeout: 60000, // 1 minute
    successThreshold: 3,
  },
  /** For database operations - lenient protection */
  DATABASE: {
    failureThreshold: 10,
    resetTimeout: 10000, // 10 seconds
    successThreshold: 1,
  },
  /** For cache operations - very lenient */
  CACHE: {
    failureThreshold: 20,
    resetTimeout: 5000, // 5 seconds
    successThreshold: 1,
  },
} as const;
