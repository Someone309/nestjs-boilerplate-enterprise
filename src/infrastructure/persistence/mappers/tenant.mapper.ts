import { Tenant, type TenantStatus } from '@modules/tenant/domain/entities/tenant.entity';
import type { TenantEntity } from '../typeorm/entities/tenant.entity';

/**
 * Tenant Mapper
 *
 * Maps between Domain Tenant entity and ORM TenantEntity.
 *
 * Section 8.2: Entity Separation
 */
export class TenantMapper {
  /**
   * Map ORM entity to Domain entity
   */
  static toDomain(ormEntity: TenantEntity): Tenant {
    return Tenant.reconstitute(ormEntity.id, {
      name: ormEntity.name,
      slug: ormEntity.slug,
      status: ormEntity.status as TenantStatus,
      settings: ormEntity.settings,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  /**
   * Map Domain entity to ORM entity
   */
  static toOrm(domainEntity: Tenant): Partial<TenantEntity> {
    return {
      id: domainEntity.id,
      name: domainEntity.name,
      slug: domainEntity.slug,
      status: domainEntity.status,
      settings: domainEntity.settings,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt,
    };
  }

  /**
   * Map multiple ORM entities to Domain entities
   */
  static toDomainList(ormEntities: TenantEntity[]): Tenant[] {
    return ormEntities.map((entity) => this.toDomain(entity));
  }
}
