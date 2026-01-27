import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTypeOrmEntity } from '../base';
import { UserEntity } from './user.entity';

/**
 * Refresh Token TypeORM Entity
 *
 * Stores refresh tokens for JWT authentication.
 *
 * Section 12.5: JWT Security Best Practices
 * - Refresh token rotation
 * - Token family for rotation detection
 * - Security metadata
 */
@Entity('refresh_tokens')
@Index(['userId'])
@Index(['familyId'])
@Index(['expiresAt'])
@Index(['token'], { unique: true })
export class RefreshTokenEntity extends BaseTypeOrmEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 500 })
  token!: string;

  /**
   * Token family ID for rotation detection
   * If an old token from the same family is used after rotation,
   * revoke the entire family (potential token theft)
   */
  @Column({ type: 'uuid', name: 'family_id' })
  familyId!: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'timestamp', name: 'revoked_at', nullable: true })
  revokedAt?: Date;

  /**
   * ID of the token that replaced this one
   * Used for rotation tracking
   */
  @Column({ type: 'uuid', name: 'replaced_by_token_id', nullable: true })
  replacedByTokenId?: string;

  /**
   * Security metadata
   */
  @Column({ type: 'varchar', length: 500, name: 'user_agent', nullable: true })
  userAgent?: string;

  @Column({ type: 'varchar', length: 45, name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ type: 'varchar', length: 100, name: 'device_id', nullable: true })
  deviceId?: string;

  /**
   * Relationship to user
   */
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  /**
   * Check if token is expired
   */
  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if token is revoked
   */
  get isRevoked(): boolean {
    return !!this.revokedAt;
  }

  /**
   * Check if token is valid
   */
  get isValid(): boolean {
    return !this.isExpired && !this.isRevoked;
  }
}
