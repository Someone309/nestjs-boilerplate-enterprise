import { Role } from '@modules/role/domain/entities/role.entity';
import type { RoleEntity } from '../typeorm/entities/role.entity';

/**
 * Role Mapper
 *
 * Maps between Domain Role entity and ORM RoleEntity.
 *
 * Section 8.2: Entity Separation
 */
export class RoleMapper {
  /**
   * Map ORM entity to Domain entity
   */
  static toDomain(ormEntity: RoleEntity): Role {
    return Role.reconstitute(ormEntity.id, {
      name: ormEntity.name,
      description: ormEntity.description,
      permissions: [...ormEntity.permissions],
      tenantId: ormEntity.tenantId,
      isSystem: ormEntity.isSystem,
      isDefault: ormEntity.isDefault,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  /**
   * Map Domain entity to ORM entity
   */
  static toOrm(domainEntity: Role): Partial<RoleEntity> {
    return {
      id: domainEntity.id,
      name: domainEntity.name,
      description: domainEntity.description,
      permissions: [...domainEntity.permissions],
      tenantId: domainEntity.tenantId,
      isSystem: domainEntity.isSystem,
      isDefault: domainEntity.isDefault,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt,
    };
  }

  /**
   * Map multiple ORM entities to Domain entities
   */
  static toDomainList(ormEntities: RoleEntity[]): Role[] {
    return ormEntities.map((entity) => this.toDomain(entity));
  }
}
