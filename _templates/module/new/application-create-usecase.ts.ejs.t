---
to: src/modules/<%= name %>/application/use-cases/create-<%= name %>.use-case.ts
---
import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
import { <%= h.changeCase.pascal(name) %> } from '../../domain/entities/<%= name %>.entity';
import {
  <%= h.changeCase.constant(name) %>_REPOSITORY,
  type I<%= h.changeCase.pascal(name) %>Repository,
} from '../../domain/repositories/<%= name %>.repository.interface';
import { generateUUID } from '@shared/utils';

export interface Create<%= h.changeCase.pascal(name) %>Input {
  name: string;
  description?: string;
}

export interface Create<%= h.changeCase.pascal(name) %>Output {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  createdAt: Date;
}

/**
 * Create <%= h.changeCase.pascal(name) %> Use Case
 */
@Injectable()
export class Create<%= h.changeCase.pascal(name) %>UseCase extends BaseUseCase<Create<%= h.changeCase.pascal(name) %>Input, Create<%= h.changeCase.pascal(name) %>Output> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(<%= h.changeCase.constant(name) %>_REPOSITORY)
    private readonly <%= h.changeCase.camel(name) %>Repository: I<%= h.changeCase.pascal(name) %>Repository,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: Create<%= h.changeCase.pascal(name) %>Input,
    context?: UseCaseContext,
  ): Promise<Result<Create<%= h.changeCase.pascal(name) %>Output>> {
    try {
      const tenantId = context?.tenantId;
      if (!tenantId) {
        return Result.fail(new Error('Tenant ID is required'));
      }

      // Check if name already exists
      const existing = await this.<%= h.changeCase.camel(name) %>Repository.findByName(
        input.name,
        tenantId,
      );
      if (existing) {
        return Result.fail(new Error('<%= h.changeCase.pascal(name) %> with this name already exists'));
      }

      // Create entity
      const <%= h.changeCase.camel(name) %> = <%= h.changeCase.pascal(name) %>.create(generateUUID(), {
        name: input.name,
        description: input.description,
        tenantId,
      });

      // Save
      await this.<%= h.changeCase.camel(name) %>Repository.save(<%= h.changeCase.camel(name) %>);

      return Result.ok({
        id: <%= h.changeCase.camel(name) %>.id,
        name: <%= h.changeCase.camel(name) %>.name,
        description: <%= h.changeCase.camel(name) %>.description,
        tenantId: <%= h.changeCase.camel(name) %>.tenantId,
        createdAt: <%= h.changeCase.camel(name) %>.createdAt,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
