---
to: src/modules/<%= name %>/domain/events/<%= name %>-deleted.event.ts
---
import { DomainEvent } from '@core/domain/base';

/**
 * Event raised when a <%= h.changeCase.pascal(name) %> is deleted
 */
export class <%= h.changeCase.pascal(name) %>DeletedEvent extends DomainEvent {
  constructor(
    public readonly <%= h.changeCase.camel(name) %>Id: string,
    public readonly tenantId: string,
  ) {
    super();
  }

  get aggregateId(): string {
    return this.<%= h.changeCase.camel(name) %>Id;
  }
}
