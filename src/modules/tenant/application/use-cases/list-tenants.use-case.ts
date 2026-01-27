import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork, PaginatedResult } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
import type { TenantStatus } from '../../domain/entities/tenant.entity';
import {
  type ITenantRepository,
  TENANT_REPOSITORY,
} from '../../domain/repositories/tenant.repository.interface';

/**
 * List Tenants Input
 */
export interface ListTenantsInput {
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
  // Filters
  name?: string;
  status?: TenantStatus;
}

/**
 * Tenant List Item
 */
export interface TenantListItem {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  isTrialExpired: boolean;
  createdAt: Date;
}

/**
 * List Tenants Output
 */
export interface ListTenantsOutput {
  data: TenantListItem[];
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
 * List Tenants Use Case
 *
 * Lists tenants with pagination and filtering.
 * Typically only accessible by super admins.
 */
@Injectable()
export class ListTenantsUseCase extends BaseUseCase<ListTenantsInput, ListTenantsOutput> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepository: ITenantRepository,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: ListTenantsInput,
    _context?: UseCaseContext,
  ): Promise<Result<ListTenantsOutput>> {
    try {
      const page = input.page || 1;
      const limit = Math.min(input.limit || 20, 100);

      // Build filter criteria
      const criteria = {
        ...(input.name && { name: input.name }),
        ...(input.status && { status: input.status }),
      };

      // Build sort params
      const sort = input.sortField
        ? { field: input.sortField, order: input.sortOrder || ('DESC' as const) }
        : undefined;

      // Execute query
      const result: PaginatedResult<{
        id: string;
        name: string;
        slug: string;
        status: TenantStatus;
        isTrialExpired: boolean;
        createdAt: Date;
      }> = await this.tenantRepository.findMany(criteria, { page, limit }, sort);

      // Map to output
      const data: TenantListItem[] = result.data.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        isTrialExpired: tenant.isTrialExpired,
        createdAt: tenant.createdAt,
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
