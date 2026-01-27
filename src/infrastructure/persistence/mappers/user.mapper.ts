import { User } from '@modules/user/domain/entities/user.entity';
import { Email } from '@modules/user/domain/value-objects/email.value-object';
import { Password } from '@modules/user/domain/value-objects/password.value-object';
import type { UserStatus } from '@modules/user/domain/enums/user-status.enum';
import type { UserEntity } from '../typeorm/entities/user.entity';

/**
 * User Mapper
 *
 * Maps between Domain User entity and ORM UserEntity.
 *
 * Section 8.2: Entity Separation
 * - Domain entities are separate from ORM entities
 * - Mappers handle all conversions
 */
export class UserMapper {
  /**
   * Map ORM entity to Domain entity
   */
  static toDomain(ormEntity: UserEntity): User {
    return User.reconstitute(ormEntity.id, {
      email: Email.create(ormEntity.email),
      password: Password.fromHash(ormEntity.passwordHash),
      firstName: ormEntity.firstName,
      lastName: ormEntity.lastName,
      status: ormEntity.status as UserStatus,
      tenantId: ormEntity.tenantId,
      roleIds: ormEntity.roles?.map((r) => r.id) || [],
      emailVerified: ormEntity.emailVerified,
      lastLoginAt: ormEntity.lastLoginAt,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  /**
   * Map Domain entity to ORM entity
   */
  static toOrm(domainEntity: User): Partial<UserEntity> {
    return {
      id: domainEntity.id,
      email: domainEntity.email.value,
      passwordHash: domainEntity.password.hashedValue,
      firstName: domainEntity.firstName,
      lastName: domainEntity.lastName,
      status: domainEntity.status,
      tenantId: domainEntity.tenantId,
      emailVerified: domainEntity.emailVerified,
      lastLoginAt: domainEntity.lastLoginAt,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt,
    };
  }

  /**
   * Map multiple ORM entities to Domain entities
   */
  static toDomainList(ormEntities: UserEntity[]): User[] {
    return ormEntities.map((entity) => this.toDomain(entity));
  }
}
