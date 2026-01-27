---
to: src/infrastructure/persistence/typeorm/entities/<%= name %>.entity.ts
---
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTypeOrmEntity } from '../base/base-entity.typeorm';
import { TenantEntity } from './tenant.entity';

/**
 * <%= h.changeCase.pascal(name) %> TypeORM Entity
 *
 * Note: For multi-database support, you may also need to create:
 * - Mongoose schema: src/infrastructure/persistence/mongoose/schemas/<%= name %>.schema.ts
 * - Prisma model: Add to prisma/schema.prisma
 *
 * See Section 8.6: Database Switching Guide
 */
@Entity('<%= name %>s')
export class <%= h.changeCase.pascal(name) %>Entity extends BaseTypeOrmEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant?: TenantEntity;
}
