import { randomUUID } from 'crypto';

/**
 * UUID Utility Functions
 *
 * Use UUID for all resource identifiers (Section 11.9)
 */

/**
 * Generate a new UUID v4
 */
export function generateUUID(): string {
  return randomUUID();
}

/**
 * Validate UUID v4 format
 */
export function isValidUUID(value: string): boolean {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(value);
}

/**
 * Generate a request ID with prefix
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${randomUUID().split('-')[0]}`;
}
