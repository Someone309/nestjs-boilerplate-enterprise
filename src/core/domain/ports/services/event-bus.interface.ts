import type { DomainEvent } from '../../base';

/**
 * Event Handler Interface
 */
export interface IEventHandler<TEvent extends DomainEvent = DomainEvent> {
  /**
   * Handle the event
   * @param event Domain event to handle
   */
  handle(event: TEvent): Promise<void>;
}

/**
 * Event Bus Interface
 *
 * Dispatches domain events to registered handlers.
 * Events are dispatched asynchronously after transaction commit.
 *
 * Section 6.3: Event Flow
 * Section 7.2: Messaging - Event Bus for domain event dispatch
 */
export interface IEventBus {
  /**
   * Publish a single domain event
   * @param event Domain event to publish
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publish multiple domain events
   * @param events Domain events to publish
   */
  publishAll(events: DomainEvent[]): Promise<void>;

  /**
   * Subscribe a handler to an event type
   * @param eventName Event name/type
   * @param handler Event handler
   */
  subscribe(eventName: string, handler: IEventHandler): void;

  /**
   * Unsubscribe a handler from an event type
   * @param eventName Event name/type
   * @param handler Event handler
   */
  unsubscribe(eventName: string, handler: IEventHandler): void;
}

/**
 * Event Bus Token for dependency injection
 */
export const EVENT_BUS = Symbol('EVENT_BUS');
