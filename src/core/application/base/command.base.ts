/**
 * Base Command Class
 *
 * Commands represent intent to change state.
 * All write operations should use commands.
 *
 * Section 2.2: Application Layer - Commands for write operations
 * Section 6.1: Command Flow - Create Command object
 */
export abstract class BaseCommand {
  /**
   * Unique command ID for tracing
   */
  public readonly commandId: string;

  /**
   * Timestamp when command was created
   */
  public readonly timestamp: Date;

  /**
   * User who initiated the command
   */
  public readonly userId?: string;

  /**
   * Tenant context for multi-tenancy
   */
  public readonly tenantId?: string;

  /**
   * Correlation ID for request tracing
   */
  public readonly correlationId?: string;

  constructor(props?: { userId?: string; tenantId?: string; correlationId?: string }) {
    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();
    this.userId = props?.userId;
    this.tenantId = props?.tenantId;
    this.correlationId = props?.correlationId;
  }

  /**
   * Get command name for logging
   */
  get commandName(): string {
    return this.constructor.name;
  }
}
