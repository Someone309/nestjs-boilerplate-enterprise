---
to: src/modules/<%= name %>/application/use-cases/list-<%= name %>s.use-case.ts
---
import { Injectable, Inject } from '@nestjs/common';
import { BaseQueryUseCase, type UseCaseContext, Result } from '@core/application/base';
import { type ILogger, LOGGER } from '@core/domain/ports/services';
import {
  <%= h.changeCase.constant(name) %>_REPOSITORY,
  type I<%= h.changeCase.pascal(name) %>Repository,
} from '../../domain/repositories/<%= name %>.repository.interface';

export interface List<%= h.changeCase.pascal(name) %>sInput {
  page?: number;
  limit?: number;
}

export interface <%= h.changeCase.pascal(name) %>ListItem {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface List<%= h.changeCase.pascal(name) %>sOutput {
  data: <%= h.changeCase.pascal(name) %>ListItem[];
  total: number;
  page: number;
  limit: number;
}

/**
 * List <%= h.changeCase.pascal(name) %>s Use Case
 */
@Injectable()
export class List<%= h.changeCase.pascal(name) %>sUseCase extends BaseQueryUseCase<List<%= h.changeCase.pascal(name) %>sInput, List<%= h.changeCase.pascal(name) %>sOutput> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(<%= h.changeCase.constant(name) %>_REPOSITORY)
    private readonly <%= h.changeCase.camel(name) %>Repository: I<%= h.changeCase.pascal(name) %>Repository,
  ) {
    super(logger);
  }

  protected async executeImpl(
    input: List<%= h.changeCase.pascal(name) %>sInput,
    context?: UseCaseContext,
  ): Promise<Result<List<%= h.changeCase.pascal(name) %>sOutput>> {
    try {
      const tenantId = context?.tenantId;
      if (!tenantId) {
        return Result.fail(new Error('Tenant ID is required'));
      }

      const page = input.page ?? 1;
      const limit = input.limit ?? 20;

      const result = await this.<%= h.changeCase.camel(name) %>Repository.findAll(
        { tenantId },
        { page, limit },
      );

      return Result.ok({
        data: result.data.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          createdAt: item.createdAt,
        })),
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
