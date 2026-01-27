/**
 * Base Query Class
 *
 * Queries represent intent to read data.
 * All read operations should use queries.
 *
 * Section 2.2: Application Layer - Queries for read operations
 * Section 6.2: Query Flow - Create Query object
 */
export abstract class BaseQuery {
  /**
   * Unique query ID for tracing
   */
  public readonly queryId: string;

  /**
   * Timestamp when query was created
   */
  public readonly timestamp: Date;

  /**
   * User who initiated the query
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
    this.queryId = crypto.randomUUID();
    this.timestamp = new Date();
    this.userId = props?.userId;
    this.tenantId = props?.tenantId;
    this.correlationId = props?.correlationId;
  }

  /**
   * Get query name for logging
   */
  get queryName(): string {
    return this.constructor.name;
  }
}
