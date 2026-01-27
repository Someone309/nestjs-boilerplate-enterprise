import type { AggregateRoot } from '../../base';

/**
 * Pagination parameters for queries
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

/**
 * Cursor-based pagination parameters
 */
export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
  direction?: 'forward' | 'backward';
}

/**
 * Sort parameters
 */
export interface SortParams {
  field: string;
  order: 'ASC' | 'DESC';
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Cursor paginated result
 */
export interface CursorPaginatedResult<T> {
  data: T[];
  nextCursor?: string;
  prevCursor?: string;
  hasMore: boolean;
}

/**
 * Base Filter/Criteria interface
 * Implementations can extend this for specific entity filters
 */
export type FilterCriteria = Record<string, unknown>;

/**
 * Base Repository Interface
 *
 * All repository interfaces must extend this base interface.
 * Implementations live in Infrastructure layer.
 *
 * Section 8.3: Repository Contract - Database-agnostic interface
 */
export interface IRepository<
  TAggregate extends AggregateRoot<TId>,
  TId = string,
  TFilter extends FilterCriteria = FilterCriteria,
> {
  /**
   * Find entity by ID
   * @param id Entity identifier
   * @returns Entity or null if not found
   */
  findById(id: TId): Promise<TAggregate | null>;

  /**
   * Find single entity by criteria
   * @param criteria Filter criteria
   * @returns Entity or null if not found
   */
  findOne(criteria: TFilter): Promise<TAggregate | null>;

  /**
   * Find multiple entities by criteria with pagination
   * @param criteria Filter criteria
   * @param pagination Pagination params
   * @param sort Sort params
   * @returns Paginated result
   */
  findMany(
    criteria: TFilter,
    pagination?: PaginationParams,
    sort?: SortParams,
  ): Promise<PaginatedResult<TAggregate>>;

  /**
   * Find multiple entities with cursor-based pagination
   * @param criteria Filter criteria
   * @param pagination Cursor pagination params
   * @param sort Sort params
   * @returns Cursor paginated result
   */
  findManyWithCursor?(
    criteria: TFilter,
    pagination: CursorPaginationParams,
    sort?: SortParams,
  ): Promise<CursorPaginatedResult<TAggregate>>;

  /**
   * Save entity (insert or update)
   * @param entity Entity to save
   * @returns Saved entity
   */
  save(entity: TAggregate): Promise<TAggregate>;

  /**
   * Save multiple entities
   * @param entities Entities to save
   * @returns Saved entities
   */
  saveMany?(entities: TAggregate[]): Promise<TAggregate[]>;

  /**
   * Delete entity by ID
   * @param id Entity identifier
   * @returns True if deleted
   */
  delete(id: TId): Promise<boolean>;

  /**
   * Soft delete entity by ID (if supported)
   * @param id Entity identifier
   * @returns True if soft deleted
   */
  softDelete?(id: TId): Promise<boolean>;

  /**
   * Check if entity exists by criteria
   * @param criteria Filter criteria
   * @returns True if exists
   */
  exists(criteria: TFilter): Promise<boolean>;

  /**
   * Count entities by criteria
   * @param criteria Filter criteria
   * @returns Count
   */
  count(criteria: TFilter): Promise<number>;
}
