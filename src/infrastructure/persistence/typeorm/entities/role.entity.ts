import { Entity, Column, Index } from 'typeorm';
import { BaseTypeOrmEntity } from '../base';

/**
 * Role TypeORM Entity
 *
 * ORM entity for role persistence.
 * Separate from Domain Entity per Section 8.2: Entity Separation.
 */
@Entity('roles')
@Index(['name', 'tenantId'], { unique: true })
@Index(['tenantId'])
export class RoleEntity extends BaseTypeOrmEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId!: string;

  @Column({ type: 'boolean', name: 'is_system', default: false })
  isSystem!: boolean;

  @Column({ type: 'boolean', name: 'is_default', default: false })
  isDefault!: boolean;

  /**
   * Permissions stored as JSON array
   * e.g., ["users:read", "users:create", "users:update"]
   */
  @Column({ type: 'json', default: [] })
  permissions!: string[];

  /**
   * Role metadata for additional configuration
   */
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>;
}
