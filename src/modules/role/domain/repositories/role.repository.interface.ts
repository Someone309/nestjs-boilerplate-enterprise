import type { IRepository } from '@core/domain/ports/repositories';
import type { Role } from '../entities/role.entity';

/**
 * Role Filter Criteria
 */
export interface RoleFilterCriteria {
  name?: string;
  tenantId?: string;
  isSystem?: boolean;
  [key: string]: unknown;
}

/**
 * Role Repository Interface
 *
 * Section 8.3: Repository Contract
 */
export interface IRoleRepository extends IRepository<Role, string, RoleFilterCriteria> {
  /**
   * Find role by name within a tenant
   */
  findByName(name: string, tenantId: string): Promise<Role | null>;

  /**
   * Find system roles
   */
  findSystemRoles(): Promise<Role[]>;

  /**
   * Find roles by IDs
   */
  findByIds(ids: string[]): Promise<Role[]>;
}

/**
 * Role Repository Token for DI
 */
export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
