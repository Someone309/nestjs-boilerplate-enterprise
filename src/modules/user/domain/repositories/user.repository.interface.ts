import type {
  IRepository,
  PaginatedResult,
  PaginationParams,
  SortParams,
} from '@core/domain/ports/repositories';
import type { User } from '../entities/user.entity';

/**
 * User Filter Criteria
 */
export interface UserFilterCriteria {
  email?: string;
  status?: string;
  tenantId?: string;
  roleId?: string;
  search?: string;
  emailVerified?: boolean;
  [key: string]: unknown;
}

/**
 * User Repository Interface
 *
 * Defines the contract for user persistence operations.
 * Implementations must be in infrastructure layer.
 *
 * Section 8.3: Repository Contract - Database-agnostic interface
 */
export interface IUserRepository extends IRepository<User, string, UserFilterCriteria> {
  /**
   * Find user by email within a tenant
   */
  findByEmail(email: string, tenantId: string): Promise<User | null>;

  /**
   * Find user by email across all tenants (for super admin)
   */
  findByEmailGlobal(email: string): Promise<User | null>;

  /**
   * Find users by role
   */
  findByRole(
    roleId: string,
    pagination?: PaginationParams,
    sort?: SortParams,
  ): Promise<PaginatedResult<User>>;

  /**
   * Check if email exists in tenant
   */
  emailExists(email: string, tenantId: string, excludeUserId?: string): Promise<boolean>;

  /**
   * Count active users in tenant
   */
  countActiveInTenant(tenantId: string): Promise<number>;

  /**
   * Get users pending activation
   */
  findPendingActivation(olderThan: Date): Promise<User[]>;
}

/**
 * User Repository Token for DI
 */
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
