---
to: src/modules/<%= name %>/domain/repositories/<%= name %>.repository.interface.ts
---
import type { IRepository } from '@core/domain/ports/repositories';
import type { <%= h.changeCase.pascal(name) %> } from '../entities/<%= name %>.entity';

/**
 * Injection token for <%= h.changeCase.pascal(name) %> Repository
 */
export const <%= h.changeCase.constant(name) %>_REPOSITORY = Symbol('<%= h.changeCase.constant(name) %>_REPOSITORY');

/**
 * <%= h.changeCase.pascal(name) %> Filter Criteria
 */
export interface <%= h.changeCase.pascal(name) %>FilterCriteria {
  name?: string;
  tenantId?: string;
  [key: string]: unknown;
}

/**
 * <%= h.changeCase.pascal(name) %> Repository Interface
 *
 * Section 8.3: Repository Contract - Database-agnostic interface
 */
export interface I<%= h.changeCase.pascal(name) %>Repository
  extends IRepository<<%= h.changeCase.pascal(name) %>, string, <%= h.changeCase.pascal(name) %>FilterCriteria> {
  /**
   * Find by name within a tenant
   */
  findByName(name: string, tenantId: string): Promise<<%= h.changeCase.pascal(name) %> | null>;

  /**
   * Find all by tenant
   */
  findByTenant(tenantId: string): Promise<<%= h.changeCase.pascal(name) %>[]>;
}
