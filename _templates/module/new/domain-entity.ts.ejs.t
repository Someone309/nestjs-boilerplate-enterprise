---
to: src/modules/<%= name %>/domain/entities/<%= name %>.entity.ts
---
import { AggregateRoot } from '@core/domain/base';
import { <%= h.changeCase.pascal(name) %>CreatedEvent } from '../events/<%= name %>-created.event';
import { <%= h.changeCase.pascal(name) %>UpdatedEvent } from '../events/<%= name %>-updated.event';
import { <%= h.changeCase.pascal(name) %>DeletedEvent } from '../events/<%= name %>-deleted.event';

/**
 * <%= h.changeCase.pascal(name) %> Entity Properties
 */
export interface <%= h.changeCase.pascal(name) %>Props {
  name: string;
  description?: string;
  tenantId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * <%= h.changeCase.pascal(name) %> Domain Entity
 *
 * <%= description || `Represents a ${name} in the domain.` %>
 */
export class <%= h.changeCase.pascal(name) %> extends AggregateRoot {
  private _name: string;
  private _description?: string;
  private _tenantId: string;

  private constructor(id: string, props: <%= h.changeCase.pascal(name) %>Props) {
    super(id);
    this._name = props.name;
    this._description = props.description;
    this._tenantId = props.tenantId;
    if (props.createdAt) {
      this._createdAt = props.createdAt;
    }
    if (props.updatedAt) {
      this._updatedAt = props.updatedAt;
    }
  }

  /**
   * Create a new <%= h.changeCase.pascal(name) %>
   */
  static create(id: string, props: <%= h.changeCase.pascal(name) %>Props): <%= h.changeCase.pascal(name) %> {
    const <%= h.changeCase.camel(name) %> = new <%= h.changeCase.pascal(name) %>(id, props);
    <%= h.changeCase.camel(name) %>.addDomainEvent(
      new <%= h.changeCase.pascal(name) %>CreatedEvent(id, props.name, props.tenantId),
    );
    return <%= h.changeCase.camel(name) %>;
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(id: string, props: <%= h.changeCase.pascal(name) %>Props): <%= h.changeCase.pascal(name) %> {
    return new <%= h.changeCase.pascal(name) %>(id, props);
  }

  // Getters
  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get tenantId(): string {
    return this._tenantId;
  }

  // Behaviors
  updateName(name: string): void {
    this._name = name;
    this.markUpdated();
    this.addDomainEvent(new <%= h.changeCase.pascal(name) %>UpdatedEvent(this.id, { name }));
  }

  updateDescription(description: string): void {
    this._description = description;
    this.markUpdated();
    this.addDomainEvent(new <%= h.changeCase.pascal(name) %>UpdatedEvent(this.id, { description }));
  }

  update(props: Partial<Omit<<%= h.changeCase.pascal(name) %>Props, 'tenantId' | 'createdAt' | 'updatedAt'>>): void {
    if (props.name !== undefined) {
      this._name = props.name;
    }
    if (props.description !== undefined) {
      this._description = props.description;
    }
    this.markUpdated();
    this.addDomainEvent(new <%= h.changeCase.pascal(name) %>UpdatedEvent(this.id, props));
  }

  delete(): void {
    this.addDomainEvent(new <%= h.changeCase.pascal(name) %>DeletedEvent(this.id, this._tenantId));
  }
}
