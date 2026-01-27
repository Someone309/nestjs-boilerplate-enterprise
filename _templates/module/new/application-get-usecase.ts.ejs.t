---
to: src/modules/<%= name %>/application/use-cases/get-<%= name %>.use-case.ts
---
import { Injectable, Inject } from '@nestjs/common';
import { BaseQueryUseCase, type UseCaseContext, Result } from '@core/application/base';
import { type ILogger, LOGGER } from '@core/domain/ports/services';
import { EntityNotFoundException } from '@core/domain/base';
import {
  <%= h.changeCase.constant(name) %>_REPOSITORY,
  type I<%= h.changeCase.pascal(name) %>Repository,
} from '../../domain/repositories/<%= name %>.repository.interface';

export interface Get<%= h.changeCase.pascal(name) %>Input {
  id: string;
}

export interface Get<%= h.changeCase.pascal(name) %>Output {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get <%= h.changeCase.pascal(name) %> Use Case
 */
@Injectable()
export class Get<%= h.changeCase.pascal(name) %>UseCase extends BaseQueryUseCase<Get<%= h.changeCase.pascal(name) %>Input, Get<%= h.changeCase.pascal(name) %>Output> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(<%= h.changeCase.constant(name) %>_REPOSITORY)
    private readonly <%= h.changeCase.camel(name) %>Repository: I<%= h.changeCase.pascal(name) %>Repository,
  ) {
    super(logger);
  }

  protected async executeImpl(
    input: Get<%= h.changeCase.pascal(name) %>Input,
    context?: UseCaseContext,
  ): Promise<Result<Get<%= h.changeCase.pascal(name) %>Output>> {
    try {
      const tenantId = context?.tenantId;
      if (!tenantId) {
        return Result.fail(new Error('Tenant ID is required'));
      }

      const <%= h.changeCase.camel(name) %> = await this.<%= h.changeCase.camel(name) %>Repository.findById(input.id);

      if (!<%= h.changeCase.camel(name) %>) {
        return Result.fail(new EntityNotFoundException('<%= h.changeCase.pascal(name) %>', input.id));
      }

      if (<%= h.changeCase.camel(name) %>.tenantId !== tenantId) {
        return Result.fail(new EntityNotFoundException('<%= h.changeCase.pascal(name) %>', input.id));
      }

      return Result.ok({
        id: <%= h.changeCase.camel(name) %>.id,
        name: <%= h.changeCase.camel(name) %>.name,
        description: <%= h.changeCase.camel(name) %>.description,
        tenantId: <%= h.changeCase.camel(name) %>.tenantId,
        createdAt: <%= h.changeCase.camel(name) %>.createdAt,
        updatedAt: <%= h.changeCase.camel(name) %>.updatedAt,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
