import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { EVENT_BUS } from '@core/domain/ports/services';
import { EventBusService } from './event-bus.service';
import { EventHandlerRegistryService } from './event-handler-registry.service';

/**
 * Event Bus Module
 *
 * Provides domain event dispatching and automatic handler registration.
 * Default implementation uses in-process event bus.
 * For distributed systems, implement Redis Pub/Sub or message queue.
 *
 * Section 3.1: Core Modules - EventBusModule
 * Section 6.3: Event Flow
 */
@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [
    EventBusService,
    EventHandlerRegistryService,
    {
      provide: EVENT_BUS,
      useClass: EventBusService,
    },
  ],
  exports: [EventBusService, EVENT_BUS, EventHandlerRegistryService],
})
export class EventBusModule {}
