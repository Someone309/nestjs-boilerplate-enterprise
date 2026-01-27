import { PAGINATION } from '../constants';

/**
 * Pagination Utilities
 *
 * Following Section 11.8 pagination standards
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    pagination: PaginationMeta;
  };
}

export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

export interface CursorPaginationMeta {
  cursor?: string;
  nextCursor?: string;
  prevCursor?: string;
  limit: number;
  hasMore: boolean;
}

/**
 * Normalize pagination parameters with defaults
 */
export function normalizePagination(params: PaginationParams): {
  page: number;
  limit: number;
  offset: number;
} {
  const page = Math.max(1, params.page || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, params.limit || PAGINATION.DEFAULT_LIMIT),
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Create pagination metadata from query results
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  totalItems: number,
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Create paginated result
 */
export function createPaginatedResult<T>(
  data: T[],
  page: number,
  limit: number,
  totalItems: number,
): PaginatedResult<T> {
  return {
    data,
    meta: {
      pagination: createPaginationMeta(page, limit, totalItems),
    },
  };
}

/**
 * Check if cursor-based pagination should be used
 * Rule: Use offset for page <= 100, cursor for larger datasets (Section 11.8)
 */
export function shouldUseCursorPagination(page: number): boolean {
  return page > PAGINATION.MAX_PAGE_FOR_OFFSET;
}

/**
 * Encode cursor (for cursor-based pagination)
 */
export function encodeCursor(data: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

/**
 * Decode cursor (for cursor-based pagination)
 */
export function decodeCursor(cursor: string): Record<string, unknown> | null {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Parse sort parameter
 * "-createdAt" -> { field: "createdAt", order: "DESC" }
 * "name" -> { field: "name", order: "ASC" }
 */
export function parseSort(sort: string): {
  field: string;
  order: 'ASC' | 'DESC';
} {
  if (sort.startsWith('-')) {
    return { field: sort.slice(1), order: 'DESC' };
  }
  return { field: sort, order: 'ASC' };
}
