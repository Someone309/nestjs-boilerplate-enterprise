import { SetMetadata } from '@nestjs/common';

/**
 * Event Handler Metadata Key
 */
export const EVENT_HANDLER_METADATA = 'event:handler';

/**
 * Event Handler Options
 */
export interface EventHandlerOptions {
  /**
   * Event name(s) to handle
   * Can be a single event name or array of event names
   */
  event: string | string[];

  /**
   * Priority (higher = runs first)
   * Default: 0
   */
  priority?: number;

  /**
   * Whether to run handler asynchronously
   * Default: true
   */
  async?: boolean;
}

/**
 * @OnEvent decorator
 *
 * Marks a method as an event handler. The decorated method
 * will be automatically registered with the EventBus on module init.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserEventHandler {
 *   @OnEvent({ event: 'UserCreatedEvent' })
 *   async handleUserCreated(event: UserCreatedEvent) {
 *     // Send welcome email
 *     await this.emailService.sendWelcome(event.email);
 *   }
 *
 *   @OnEvent({ event: ['UserUpdatedEvent', 'UserDeletedEvent'], priority: 10 })
 *   async handleUserChange(event: DomainEvent) {
 *     // Log user changes
 *     this.logger.log(`User changed: ${event.aggregateId}`);
 *   }
 * }
 * ```
 */
export function OnEvent(options: EventHandlerOptions | string): MethodDecorator {
  const normalizedOptions: EventHandlerOptions =
    typeof options === 'string' ? { event: options } : options;

  return (target, propertyKey, descriptor) => {
    SetMetadata(EVENT_HANDLER_METADATA, {
      ...normalizedOptions,
      methodName: propertyKey,
      priority: normalizedOptions.priority ?? 0,
      async: normalizedOptions.async ?? true,
    })(target, propertyKey, descriptor);

    return descriptor;
  };
}

/**
 * Event handler metadata stored on class
 */
export interface EventHandlerMetadata {
  event: string | string[];
  methodName: string | symbol;
  priority: number;
  async: boolean;
}
