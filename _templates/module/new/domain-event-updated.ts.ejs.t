---
to: src/modules/<%= name %>/domain/events/<%= name %>-updated.event.ts
---
import { DomainEvent } from '@core/domain/base';
import type { <%= h.changeCase.pascal(name) %> } from '../entities/<%= name %>.entity';

/**
 * Event raised when a <%= h.changeCase.pascal(name) %> is updated
 */
export class <%= h.changeCase.pascal(name) %>UpdatedEvent extends DomainEvent {
  constructor(public readonly <%= h.changeCase.camel(name) %>: <%= h.changeCase.pascal(name) %>) {
    super();
  }

  get aggregateId(): string {
    return this.<%= h.changeCase.camel(name) %>.id;
  }
}
