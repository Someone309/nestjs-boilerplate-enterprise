---
to: src/modules/<%= name %>/domain/events/<%= name %>-created.event.ts
---
import { DomainEvent } from '@core/domain/base';
import type { <%= h.changeCase.pascal(name) %> } from '../entities/<%= name %>.entity';

/**
 * Event raised when a <%= h.changeCase.pascal(name) %> is created
 */
export class <%= h.changeCase.pascal(name) %>CreatedEvent extends DomainEvent {
  constructor(public readonly <%= h.changeCase.camel(name) %>: <%= h.changeCase.pascal(name) %>) {
    super();
  }

  get aggregateId(): string {
    return this.<%= h.changeCase.camel(name) %>.id;
  }
}
