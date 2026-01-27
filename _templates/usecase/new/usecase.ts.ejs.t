---
to: src/modules/<%= module %>/application/use-cases/<%= name %>.use-case.ts
---
import { Injectable, Inject } from '@nestjs/common';
<% if (type === 'command') { -%>
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
<% } else { -%>
import { BaseQueryUseCase, type UseCaseContext, Result } from '@core/application/base';
import { type ILogger, LOGGER } from '@core/domain/ports/services';
<% } -%>

export interface <%= h.changeCase.pascal(name) %>Input {
  // Define input properties
}

export interface <%= h.changeCase.pascal(name) %>Output {
  // Define output properties
}

/**
 * <%= h.changeCase.pascal(name) %> Use Case
 *
 * Type: <%= type === 'command' ? 'Command (modifies state)' : 'Query (read-only)' %>
 */
@Injectable()
<% if (type === 'command') { -%>
export class <%= h.changeCase.pascal(name) %>UseCase extends BaseUseCase<<%= h.changeCase.pascal(name) %>Input, <%= h.changeCase.pascal(name) %>Output> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    // Inject repositories and services here
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: <%= h.changeCase.pascal(name) %>Input,
    context?: UseCaseContext,
  ): Promise<Result<<%= h.changeCase.pascal(name) %>Output>> {
    try {
      // Implement use case logic here

      return Result.ok({
        // Return output
      } as <%= h.changeCase.pascal(name) %>Output);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
<% } else { -%>
export class <%= h.changeCase.pascal(name) %>UseCase extends BaseQueryUseCase<<%= h.changeCase.pascal(name) %>Input, <%= h.changeCase.pascal(name) %>Output> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    // Inject repositories and services here
  ) {
    super(logger);
  }

  protected async executeImpl(
    input: <%= h.changeCase.pascal(name) %>Input,
    context?: UseCaseContext,
  ): Promise<Result<<%= h.changeCase.pascal(name) %>Output>> {
    try {
      // Implement use case logic here

      return Result.ok({
        // Return output
      } as <%= h.changeCase.pascal(name) %>Output);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
<% } -%>
