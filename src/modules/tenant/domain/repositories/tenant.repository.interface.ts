import type { IRepository } from '@core/domain/ports/repositories';
import type { Tenant, TenantStatus } from '../entities/tenant.entity';

/**
 * Tenant Filter Criteria
 */
export interface TenantFilterCriteria {
  name?: string;
  slug?: string;
  status?: TenantStatus;
  ownerId?: string;
  [key: string]: unknown;
}

/**
 * Tenant Repository Interface
 *
 * Section 8.3: Repository Contract
 */
export interface ITenantRepository extends IRepository<Tenant, string, TenantFilterCriteria> {
  /**
   * Find tenant by slug
   */
  findBySlug(slug: string): Promise<Tenant | null>;

  /**
   * Find tenants by owner
   */
  findByOwner(ownerId: string): Promise<Tenant[]>;

  /**
   * Check if slug exists
   */
  slugExists(slug: string, excludeTenantId?: string): Promise<boolean>;

  /**
   * Find expired trial tenants
   */
  findExpiredTrials(): Promise<Tenant[]>;
}

/**
 * Tenant Repository Token for DI
 */
export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY');
