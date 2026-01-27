import { Global, Module } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker';

/**
 * Resilience Module
 *
 * Provides resilience patterns for production stability:
 * - Circuit Breaker: Fail fast on cascading failures
 * - Retry: Handle transient failures with exponential backoff
 * - Timeout: Prevent hanging requests
 * - Fallback: Graceful degradation
 *
 * Section 12.1: Resilience Patterns
 */
@Global()
@Module({
  providers: [CircuitBreakerService],
  exports: [CircuitBreakerService],
})
export class ResilienceModule {}
