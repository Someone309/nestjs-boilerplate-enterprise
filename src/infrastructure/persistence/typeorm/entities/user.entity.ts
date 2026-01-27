import { Entity, Column, Index, ManyToMany, JoinTable, BeforeInsert, BeforeUpdate } from 'typeorm';
import { BaseTypeOrmEntity } from '../base';
import { RoleEntity } from './role.entity';

/**
 * User TypeORM Entity
 *
 * ORM entity for user persistence.
 * Separate from Domain Entity per Section 8.2: Entity Separation.
 *
 * Section 8.2: Domain entities vs ORM entities
 * Section 8.6: Database switching via Infrastructure layer changes only
 */
@Entity('users')
@Index(['email', 'tenantId'], { unique: true })
@Index(['tenantId'])
@Index(['status'])
export class UserEntity extends BaseTypeOrmEntity {
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName!: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status!: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId!: string;

  @Column({ type: 'boolean', name: 'email_verified', default: false })
  emailVerified!: boolean;

  @Column({ type: 'timestamp', name: 'last_login_at', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'timestamp', name: 'email_verified_at', nullable: true })
  emailVerifiedAt?: Date;

  @Column({ type: 'varchar', length: 255, name: 'verification_token', nullable: true })
  verificationToken?: string;

  @Column({ type: 'varchar', length: 255, name: 'password_reset_token', nullable: true })
  passwordResetToken?: string;

  @Column({ type: 'timestamp', name: 'password_reset_expires_at', nullable: true })
  passwordResetExpiresAt?: Date;

  @Column({ type: 'int', name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts!: number;

  @Column({ type: 'timestamp', name: 'locked_until', nullable: true })
  lockedUntil?: Date;

  /**
   * Many-to-Many relationship with roles
   */
  @ManyToMany(() => RoleEntity, { eager: false })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles?: RoleEntity[];

  /**
   * Normalize email before insert/update
   */
  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail(): void {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }
}
