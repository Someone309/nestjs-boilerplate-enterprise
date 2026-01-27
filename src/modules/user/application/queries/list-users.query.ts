import { BaseQuery } from '@core/application/base';
import type { PaginationParams, SortParams } from '@core/domain/ports/repositories';

/**
 * List Users Query Input
 */
export interface ListUsersInput {
  filters?: {
    status?: string;
    roleId?: string;
    search?: string;
    emailVerified?: boolean;
  };
  pagination?: PaginationParams;
  sort?: SortParams;
}

/**
 * List Users Query
 *
 * Query to fetch paginated list of users.
 *
 * Section 2.2: Application Layer - Queries for read operations
 */
export class ListUsersQuery extends BaseQuery {
  public readonly input: ListUsersInput;

  constructor(
    input: ListUsersInput,
    props?: { userId?: string; tenantId?: string; correlationId?: string },
  ) {
    super(props);
    this.input = input;
  }
}
