import { Entity, Column, Index } from 'typeorm';
import { BaseTypeOrmEntity } from '../base';

/**
 * Tenant TypeORM Entity
 *
 * ORM entity for tenant persistence.
 * Separate from Domain Entity per Section 8.2: Entity Separation.
 */
@Entity('tenants')
@Index(['slug'], { unique: true })
@Index(['status'])
export class TenantEntity extends BaseTypeOrmEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  domain?: string;

  @Column({ type: 'varchar', length: 500, name: 'logo_url', nullable: true })
  logoUrl?: string;

  /**
   * Tenant settings stored as JSON
   * e.g., { timezone: "UTC", locale: "en-US", features: {...} }
   */
  @Column({ type: 'json', default: {} })
  settings!: Record<string, unknown>;

  /**
   * Tenant billing information
   */
  @Column({ type: 'json', nullable: true })
  billing?: {
    plan?: string;
    trialEndsAt?: string;
    subscriptionId?: string;
  };

  /**
   * Tenant limits
   */
  @Column({ type: 'json', default: {} })
  limits!: {
    maxUsers?: number;
    maxStorage?: number;
    maxApiCalls?: number;
  };

  @Column({ type: 'uuid', name: 'owner_id', nullable: true })
  @Index()
  ownerId?: string;

  @Column({ type: 'timestamp', name: 'trial_ends_at', nullable: true })
  trialEndsAt?: Date;

  @Column({ type: 'timestamp', name: 'suspended_at', nullable: true })
  suspendedAt?: Date;

  @Column({ type: 'varchar', length: 500, name: 'suspension_reason', nullable: true })
  suspensionReason?: string;
}
