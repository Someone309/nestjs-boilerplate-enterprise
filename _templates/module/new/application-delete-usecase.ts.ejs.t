---
to: src/modules/<%= name %>/application/use-cases/delete-<%= name %>.use-case.ts
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

export interface Delete<%= h.changeCase.pascal(name) %>Input {
  id: string;
}

export interface Delete<%= h.changeCase.pascal(name) %>Output {
  id: string;
  deleted: boolean;
  deletedAt: Date;
}

/**
 * Delete <%= h.changeCase.pascal(name) %> Use Case
 */
@Injectable()
export class Delete<%= h.changeCase.pascal(name) %>UseCase extends BaseUseCase<Delete<%= h.changeCase.pascal(name) %>Input, Delete<%= h.changeCase.pascal(name) %>Output> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(<%= h.changeCase.constant(name) %>_REPOSITORY)
    private readonly <%= h.changeCase.camel(name) %>Repository: I<%= h.changeCase.pascal(name) %>Repository,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: Delete<%= h.changeCase.pascal(name) %>Input,
    context?: UseCaseContext,
  ): Promise<Result<Delete<%= h.changeCase.pascal(name) %>Output>> {
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

      // Mark for deletion and get events
      <%= h.changeCase.camel(name) %>.delete();

      // Delete
      const deleted = await this.<%= h.changeCase.camel(name) %>Repository.delete(input.id);
      if (!deleted) {
        return Result.fail(new Error('Failed to delete <%= name %>'));
      }

      return Result.ok({
        id: input.id,
        deleted: true,
        deletedAt: new Date(),
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
