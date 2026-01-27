---
to: src/modules/<%= module %>/domain/entities/<%= name %>.entity.ts
---
import { Entity } from '@core/domain/base';

/**
 * <%= h.changeCase.pascal(name) %> Entity Properties
 */
export interface <%= h.changeCase.pascal(name) %>Props {
  // Add properties here
}

/**
 * <%= h.changeCase.pascal(name) %> Domain Entity
 */
export class <%= h.changeCase.pascal(name) %> extends Entity<<%= h.changeCase.pascal(name) %>Props> {
  /**
   * Create a new <%= h.changeCase.pascal(name) %>
   */
  static create(props: <%= h.changeCase.pascal(name) %>Props, id?: string): <%= h.changeCase.pascal(name) %> {
    return new <%= h.changeCase.pascal(name) %>(props, id);
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(
    id: string,
    props: <%= h.changeCase.pascal(name) %>Props,
    createdAt: Date,
    updatedAt: Date,
  ): <%= h.changeCase.pascal(name) %> {
    const entity = new <%= h.changeCase.pascal(name) %>(props, id);
    entity._createdAt = createdAt;
    entity._updatedAt = updatedAt;
    return entity;
  }
}
