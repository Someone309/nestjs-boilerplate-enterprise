import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork, PaginatedResult } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
import {
  type IRoleRepository,
  ROLE_REPOSITORY,
} from '../../domain/repositories/role.repository.interface';

/**
 * List Roles Input
 */
export interface ListRolesInput {
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
  // Filters
  name?: string;
  isSystem?: boolean;
}

/**
 * Role List Item
 */
export interface RoleListItem {
  id: string;
  name: string;
  description?: string;
  permissionCount: number;
  isSystem: boolean;
  isDefault: boolean;
  createdAt: Date;
}

/**
 * List Roles Output
 */
export interface ListRolesOutput {
  data: RoleListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * List Roles Use Case
 *
 * Lists roles with pagination and filtering.
 */
@Injectable()
export class ListRolesUseCase extends BaseUseCase<ListRolesInput, ListRolesOutput> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: IRoleRepository,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: ListRolesInput,
    context?: UseCaseContext,
  ): Promise<Result<ListRolesOutput>> {
    try {
      const tenantId = context?.tenantId;
      if (!tenantId) {
        return Result.fail(new Error('Tenant ID is required'));
      }

      const page = input.page || 1;
      const limit = Math.min(input.limit || 20, 100);

      // Build filter criteria
      const criteria = {
        tenantId,
        ...(input.name && { name: input.name }),
        ...(input.isSystem !== undefined && { isSystem: input.isSystem }),
      };

      // Build sort params
      const sort = input.sortField
        ? { field: input.sortField, order: input.sortOrder || ('DESC' as const) }
        : undefined;

      // Execute query
      const result: PaginatedResult<{
        id: string;
        name: string;
        description?: string;
        permissions: readonly string[];
        isSystem: boolean;
        isDefault: boolean;
        createdAt: Date;
      }> = await this.roleRepository.findMany(criteria, { page, limit }, sort);

      // Map to output
      const data: RoleListItem[] = result.data.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        permissionCount: role.permissions.length,
        isSystem: role.isSystem,
        isDefault: role.isDefault,
        createdAt: role.createdAt,
      }));

      const totalPages = Math.ceil(result.total / limit);

      return Result.ok({
        data,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        },
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
