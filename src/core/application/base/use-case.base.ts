import type { IUnitOfWork } from '@core/domain/ports/repositories';
import type { ILogger } from '@core/domain/ports/services';
import type { Result } from './result';

/**
 * Use Case Context
 *
 * Contains contextual information for use case execution.
 */
export interface UseCaseContext {
  userId?: string;
  tenantId?: string;
  correlationId?: string;
  isSuperAdmin?: boolean;
  roles?: string[];
}

/**
 * Base Use Case Class
 *
 * Abstract base class for all use cases.
 * Provides common functionality like logging, transaction management.
 *
 * Section 2.2: Application Layer - UseCase for single business operation
 * Section 5.1: Required Patterns - Use case pattern
 */
export abstract class BaseUseCase<TInput, TOutput, TError extends Error = Error> {
  protected readonly logger: ILogger;
  protected readonly unitOfWork: IUnitOfWork;

  constructor(logger: ILogger, unitOfWork: IUnitOfWork) {
    this.logger = logger;
    this.unitOfWork = unitOfWork;
  }

  /**
   * Get use case name for logging
   */
  get useCaseName(): string {
    return this.constructor.name;
  }

  /**
   * Execute the use case with context
   */
  async execute(input: TInput, context?: UseCaseContext): Promise<Result<TOutput, TError>> {
    const childLogger = this.logger.child({
      useCase: this.useCaseName,
      userId: context?.userId,
      tenantId: context?.tenantId,
      correlationId: context?.correlationId,
    });

    childLogger.info(`Starting use case: ${this.useCaseName}`);
    const startTime = Date.now();

    try {
      const result = await this.executeImpl(input, context);
      const duration = Date.now() - startTime;

      if (result.success) {
        childLogger.info(`Use case completed successfully`, { duration });
      } else {
        childLogger.warn(`Use case failed`, { duration, error: result.error.message });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      childLogger.error(`Use case threw unexpected error`, error as Error, { duration });
      throw error;
    }
  }

  /**
   * Execute the use case within a transaction
   */
  async executeInTransaction(
    input: TInput,
    context?: UseCaseContext,
  ): Promise<Result<TOutput, TError>> {
    return this.unitOfWork.executeInTransaction(async () => {
      const result = await this.execute(input, context);
      if (!result.success) {
        throw result.error; // Trigger rollback
      }
      return result;
    });
  }

  /**
   * Implementation of the use case logic
   * Must be implemented by subclasses
   */
  protected abstract executeImpl(
    input: TInput,
    context?: UseCaseContext,
  ): Promise<Result<TOutput, TError>>;
}

/**
 * Use Case without transaction (for read operations)
 */
export abstract class BaseQueryUseCase<TInput, TOutput, TError extends Error = Error> {
  protected readonly logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Get use case name for logging
   */
  get useCaseName(): string {
    return this.constructor.name;
  }

  /**
   * Execute the query use case
   */
  async execute(input: TInput, context?: UseCaseContext): Promise<Result<TOutput, TError>> {
    const childLogger = this.logger.child({
      useCase: this.useCaseName,
      userId: context?.userId,
      tenantId: context?.tenantId,
      correlationId: context?.correlationId,
    });

    childLogger.debug(`Executing query: ${this.useCaseName}`);
    const startTime = Date.now();

    try {
      const result = await this.executeImpl(input, context);
      const duration = Date.now() - startTime;

      childLogger.debug(`Query completed`, { duration, success: result.success });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      childLogger.error(`Query threw unexpected error`, error as Error, { duration });
      throw error;
    }
  }

  /**
   * Implementation of the query logic
   */
  protected abstract executeImpl(
    input: TInput,
    context?: UseCaseContext,
  ): Promise<Result<TOutput, TError>>;
}
