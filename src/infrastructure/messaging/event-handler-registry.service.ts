import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { EVENT_BUS, type IEventBus, type IEventHandler } from '@core/domain/ports/services';
import type { DomainEvent } from '@core/domain/base';
import {
  EVENT_HANDLER_METADATA,
  type EventHandlerMetadata,
} from '@shared/decorators/event-handler.decorator';

/**
 * Registered handler info
 */
interface RegisteredHandler {
  instance: object;
  methodName: string | symbol;
  priority: number;
  async: boolean;
}

/**
 * Event Handler Registry Service
 *
 * Automatically discovers and registers event handlers decorated with @OnEvent.
 * Runs during module initialization.
 *
 * Section 6.3: Event Flow - Automatic handler registration
 */
@Injectable()
export class EventHandlerRegistryService implements OnModuleInit {
  private readonly logger = new Logger(EventHandlerRegistryService.name);
  private readonly handlersByEvent = new Map<string, RegisteredHandler[]>();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  onModuleInit(): void {
    this.discoverHandlers();
    this.registerHandlers();
  }

  /**
   * Discover all event handlers in the application
   */
  private discoverHandlers(): void {
    const providers = this.discoveryService.getProviders();

    providers.forEach((wrapper: InstanceWrapper) => {
      const instance = wrapper.instance as object | null;
      if (!instance || typeof instance !== 'object') {
        return;
      }

      // Get all method names from the prototype
      const prototype = Object.getPrototypeOf(instance) as object;
      const methodNames = Object.getOwnPropertyNames(prototype).filter(
        (name) =>
          name !== 'constructor' &&
          typeof (instance as Record<string, unknown>)[name] === 'function',
      );

      methodNames.forEach((methodName) => {
        const method = (instance as Record<string, unknown>)[methodName];
        if (typeof method !== 'function') {
          return;
        }

        const metadata = this.reflector.get<EventHandlerMetadata>(EVENT_HANDLER_METADATA, method);

        if (metadata) {
          const events = Array.isArray(metadata.event) ? metadata.event : [metadata.event];

          events.forEach((eventName) => {
            if (!this.handlersByEvent.has(eventName)) {
              this.handlersByEvent.set(eventName, []);
            }

            const handlers = this.handlersByEvent.get(eventName);
            if (handlers) {
              handlers.push({
                instance,
                methodName: metadata.methodName,
                priority: metadata.priority,
                async: metadata.async,
              });
            }

            this.logger.debug(
              `Discovered handler for ${eventName}: ${wrapper.name}.${String(metadata.methodName)}`,
            );
          });
        }
      });
    });

    // Sort handlers by priority (higher first)
    this.handlersByEvent.forEach((handlers) => {
      handlers.sort((a, b) => b.priority - a.priority);
    });
  }

  /**
   * Register discovered handlers with the event bus
   */
  private registerHandlers(): void {
    this.handlersByEvent.forEach((handlers, eventName) => {
      handlers.forEach((handler) => {
        const eventHandler: IEventHandler = {
          handle: async (event: DomainEvent): Promise<void> => {
            const method = (handler.instance as Record<string | symbol, unknown>)[
              handler.methodName
            ] as (event: DomainEvent) => Promise<void> | void;

            if (handler.async) {
              await method.call(handler.instance, event);
            } else {
              // Fire and forget for sync handlers - explicitly void the potential promise
              void method.call(handler.instance, event);
            }
          },
        };

        this.eventBus.subscribe(eventName, eventHandler);
      });

      this.logger.log(`Registered ${handlers.length} handler(s) for event: ${eventName}`);
    });
  }

  /**
   * Get count of handlers for an event
   */
  getHandlerCount(eventName: string): number {
    return this.handlersByEvent.get(eventName)?.length ?? 0;
  }

  /**
   * Get all registered event names
   */
  getRegisteredEvents(): string[] {
    return Array.from(this.handlersByEvent.keys());
  }
}
