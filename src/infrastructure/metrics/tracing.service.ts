import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { trace, Tracer, Span, SpanStatusCode, context, Context } from '@opentelemetry/api';

/**
 * Tracing Service
 *
 * Section 12.9: Production Checklist - Distributed tracing (OpenTelemetry)
 *
 * Provides OpenTelemetry tracing capabilities for distributed tracing.
 * Traces are automatically collected for HTTP requests and database queries.
 */
@Injectable()
export class TracingService implements OnModuleInit, OnModuleDestroy {
  private tracer!: Tracer;
  private serviceName: string;

  constructor(private readonly configService: ConfigService) {
    this.serviceName = this.configService.get<string>('app.name', 'nestjs-app');
  }

  onModuleInit(): void {
    // Get tracer from the global tracer provider
    this.tracer = trace.getTracer(this.serviceName, '1.0.0');
  }

  onModuleDestroy(): void {
    // Cleanup if needed
  }

  /**
   * Get the tracer instance
   */
  getTracer(): Tracer {
    return this.tracer;
  }

  /**
   * Start a new span
   */
  startSpan(name: string, attributes?: Record<string, string | number | boolean>): Span {
    const span = this.tracer.startSpan(name);

    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        span.setAttribute(key, value);
      });
    }

    return span;
  }

  /**
   * Start a span as a child of the current active span
   */
  startActiveSpan<T>(
    name: string,
    fn: (span: Span) => T,
    attributes?: Record<string, string | number | boolean>,
  ): T {
    return this.tracer.startActiveSpan(name, (span) => {
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }

      try {
        const result = fn(span);

        // Handle promises
        if (result instanceof Promise) {
          return result
            .then((value: unknown) => {
              span.setStatus({ code: SpanStatusCode.OK });
              span.end();
              return value as Awaited<T>;
            })
            .catch((error: unknown) => {
              this.recordError(span, error);
              span.end();
              throw error;
            }) as T;
        }

        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        return result;
      } catch (error) {
        this.recordError(span, error);
        span.end();
        throw error;
      }
    });
  }

  /**
   * Record an error on a span
   */
  recordError(span: Span, error: unknown): void {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error) {
      span.recordException(error);
    }
  }

  /**
   * Add attributes to the current active span
   */
  addAttributes(attributes: Record<string, string | number | boolean>): void {
    const span = trace.getActiveSpan();
    if (span) {
      Object.entries(attributes).forEach(([key, value]) => {
        span.setAttribute(key, value);
      });
    }
  }

  /**
   * Add an event to the current active span
   */
  addEvent(name: string, attributes?: Record<string, string | number | boolean>): void {
    const span = trace.getActiveSpan();
    if (span) {
      span.addEvent(name, attributes);
    }
  }

  /**
   * Get the current context
   */
  getCurrentContext(): Context {
    return context.active();
  }

  /**
   * Run a function within a specific context
   */
  withContext<T>(ctx: Context, fn: () => T): T {
    return context.with(ctx, fn);
  }

  /**
   * Create a traced function wrapper
   */
  traced<T extends (...args: unknown[]) => unknown>(
    name: string,
    fn: T,
    attributes?: Record<string, string | number | boolean>,
  ): T {
    // Use bind to preserve both the tracing service context and the original function context
    const boundStartActiveSpan = this.startActiveSpan.bind(this);

    return function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
      return boundStartActiveSpan(name, () => fn.apply(this, args) as ReturnType<T>, attributes);
    } as T;
  }
}

/**
 * Trace decorator for methods
 *
 * @example
 * class UserService {
 *   @Trace('user.create')
 *   async createUser(data: CreateUserDto): Promise<User> {
 *     // Implementation
 *   }
 * }
 */
export function Trace(
  spanName?: string,
  attributes?: Record<string, string | number | boolean>,
): MethodDecorator {
  return function (
    _target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;
    const name = spanName || String(propertyKey);

    descriptor.value = function (...args: unknown[]): unknown {
      const tracer = trace.getTracer('app');

      return tracer.startActiveSpan(name, (span) => {
        if (attributes) {
          Object.entries(attributes).forEach(([key, value]) => {
            span.setAttribute(key, value);
          });
        }

        try {
          const result = originalMethod.apply(this, args);

          if (result instanceof Promise) {
            return result
              .then((value: unknown) => {
                span.setStatus({ code: SpanStatusCode.OK });
                span.end();
                return value;
              })
              .catch((error: unknown) => {
                span.setStatus({
                  code: SpanStatusCode.ERROR,
                  message: error instanceof Error ? error.message : String(error),
                });
                if (error instanceof Error) {
                  span.recordException(error);
                }
                span.end();
                throw error;
              });
          }

          span.setStatus({ code: SpanStatusCode.OK });
          span.end();
          return result;
        } catch (error) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : String(error),
          });
          if (error instanceof Error) {
            span.recordException(error);
          }
          span.end();
          throw error;
        }
      });
    };

    return descriptor;
  };
}
