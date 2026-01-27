import { BaseQuery } from '@core/application/base';

/**
 * Get User By ID Query Input
 */
export interface GetUserByIdInput {
  userId: string;
}

/**
 * Get User By ID Query
 *
 * Query to fetch a user by their ID.
 *
 * Section 2.2: Application Layer - Queries for read operations
 */
export class GetUserByIdQuery extends BaseQuery {
  public readonly input: GetUserByIdInput;

  constructor(
    input: GetUserByIdInput,
    props?: { userId?: string; tenantId?: string; correlationId?: string },
  ) {
    super(props);
    this.input = input;
  }
}
