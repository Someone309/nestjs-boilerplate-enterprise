import { Injectable, Logger } from '@nestjs/common';
import type { IEventBus, IEventHandler } from '@core/domain/ports/services';
import type { DomainEvent } from '@core/domain/base';

/**
 * In-Process Event Bus Implementation
 *
 * Simple synchronous event bus for single-instance deployments.
 * For distributed systems, replace with Redis Pub/Sub or message queue.
 *
 * Section 6.3: Event Flow
 * Section 7.2: Messaging - Event Bus for domain event dispatch
 */
@Injectable()
export class EventBusService implements IEventBus {
  private readonly handlers = new Map<string, Set<IEventHandler>>();
  private readonly logger = new Logger(EventBusService.name);

  publish(event: DomainEvent): Promise<void> {
    const eventName = event.eventName;
    const handlers = this.handlers.get(eventName);

    if (!handlers || handlers.size === 0) {
      this.logger.debug(`No handlers registered for event: ${eventName}`);
      return Promise.resolve();
    }

    this.logger.debug(
      `Publishing event: ${eventName} (${event.eventId}) to ${handlers.size} handlers`,
    );

    // Execute handlers asynchronously but don't await (fire-and-forget)
    // This ensures events don't block the main request
    const handlerPromises = Array.from(handlers).map(async (handler) => {
      try {
        await handler.handle(event);
      } catch (error) {
        // Log but don't throw - event handlers should not affect the main flow
        this.logger.error(
          `Error in event handler for ${eventName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    });

    // Fire and forget - don't block on handler completion
    void Promise.allSettled(handlerPromises);
    return Promise.resolve();
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    this.logger.debug(`Publishing ${events.length} events`);

    for (const event of events) {
      await this.publish(event);
    }
  }

  subscribe(eventName: string, handler: IEventHandler): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    const eventHandlers = this.handlers.get(eventName);
    if (eventHandlers) {
      eventHandlers.add(handler);
    }
    this.logger.debug(`Handler subscribed to event: ${eventName}`);
  }

  unsubscribe(eventName: string, handler: IEventHandler): void {
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      handlers.delete(handler);
      this.logger.debug(`Handler unsubscribed from event: ${eventName}`);
    }
  }

  /**
   * Get the number of handlers for an event
   * Useful for testing and debugging
   */
  getHandlerCount(eventName: string): number {
    return this.handlers.get(eventName)?.size || 0;
  }

  /**
   * Clear all handlers
   * Useful for testing
   */
  clearAllHandlers(): void {
    this.handlers.clear();
  }
}
