---
to: src/modules/<%= name %>/application/use-cases/update-<%= name %>.use-case.ts
---
import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
import { EntityNotFoundException } from '@core/domain/base';
import {
  <%= h.changeCase.constant(name) %>_REPOSITORY,
  type I<%= h.changeCase.pascal(name) %>Repository,
} from '../../domain/repositories/<%= name %>.repository.interface';

export interface Update<%= h.changeCase.pascal(name) %>Input {
  id: string;
  name?: string;
  description?: string;
}

export interface Update<%= h.changeCase.pascal(name) %>Output {
  id: string;
  name: string;
  description?: string;
  updatedAt: Date;
}

/**
 * Update <%= h.changeCase.pascal(name) %> Use Case
 */
@Injectable()
export class Update<%= h.changeCase.pascal(name) %>UseCase extends BaseUseCase<Update<%= h.changeCase.pascal(name) %>Input, Update<%= h.changeCase.pascal(name) %>Output> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(<%= h.changeCase.constant(name) %>_REPOSITORY)
    private readonly <%= h.changeCase.camel(name) %>Repository: I<%= h.changeCase.pascal(name) %>Repository,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: Update<%= h.changeCase.pascal(name) %>Input,
    context?: UseCaseContext,
  ): Promise<Result<Update<%= h.changeCase.pascal(name) %>Output>> {
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

      // Check name uniqueness if changing
      if (input.name && input.name !== <%= h.changeCase.camel(name) %>.name) {
        const existing = await this.<%= h.changeCase.camel(name) %>Repository.findByName(
          input.name,
          tenantId,
        );
        if (existing && existing.id !== input.id) {
          return Result.fail(new Error('<%= h.changeCase.pascal(name) %> with this name already exists'));
        }
      }

      // Update
      <%= h.changeCase.camel(name) %>.update({
        name: input.name,
        description: input.description,
      });

      // Save
      await this.<%= h.changeCase.camel(name) %>Repository.save(<%= h.changeCase.camel(name) %>);

      return Result.ok({
        id: <%= h.changeCase.camel(name) %>.id,
        name: <%= h.changeCase.camel(name) %>.name,
        description: <%= h.changeCase.camel(name) %>.description,
        updatedAt: <%= h.changeCase.camel(name) %>.updatedAt,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
