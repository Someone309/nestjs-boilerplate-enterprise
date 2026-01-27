import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
import type { UserStatus } from '../../domain/enums/user-status.enum';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';

/**
 * List Users Input
 */
export interface ListUsersInput {
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
  // Filters
  status?: string;
  search?: string;
  roleId?: string;
}

/**
 * User List Item
 */
export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

/**
 * List Users Output
 */
export interface ListUsersOutput {
  data: UserListItem[];
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
 * List Users Use Case
 *
 * Lists users with pagination and filtering.
 *
 * Section 2.2: Application Layer - Query for list operation
 */
@Injectable()
export class ListUsersUseCase extends BaseUseCase<ListUsersInput, ListUsersOutput> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: ListUsersInput,
    context?: UseCaseContext,
  ): Promise<Result<ListUsersOutput>> {
    try {
      const tenantId = context?.tenantId;
      if (!tenantId) {
        return Result.fail(new Error('Tenant ID is required'));
      }

      const page = input.page || 1;
      const limit = Math.min(input.limit || 20, 100); // Cap at 100

      // Build filter criteria
      const criteria = {
        tenantId,
        ...(input.status && { status: input.status }),
        ...(input.search && { search: input.search }),
        ...(input.roleId && { roleId: input.roleId }),
      };

      // Build sort params
      const sort = input.sortField
        ? { field: input.sortField, order: input.sortOrder || ('DESC' as const) }
        : undefined;

      // Execute query
      const result = await this.userRepository.findMany(criteria, { page, limit }, sort);

      // Map to output
      const data: UserListItem[] = result.data.map((user) => ({
        id: user.id,
        email: user.email.value,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        status: user.status,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt ?? null,
        createdAt: user.createdAt,
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
