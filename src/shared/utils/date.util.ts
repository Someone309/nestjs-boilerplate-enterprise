/**
 * Date Utility Functions
 *
 * All timestamps in UTC with Z suffix (Section 11.9)
 */

/**
 * Get current timestamp in ISO 8601 format (UTC)
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Convert Date to ISO 8601 string (UTC)
 */
export function toISO(date: Date): string {
  return date.toISOString();
}

/**
 * Parse ISO 8601 string to Date
 */
export function fromISO(isoString: string): Date {
  return new Date(isoString);
}

/**
 * Get Unix timestamp (seconds since epoch)
 */
export function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Convert Date to Unix timestamp
 */
export function toUnix(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Convert Unix timestamp to Date
 */
export function fromUnix(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Add seconds to a date
 */
export function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date, minutes: number): Date {
  return addSeconds(date, minutes * 60);
}

/**
 * Add hours to a date
 */
export function addHours(date: Date, hours: number): Date {
  return addMinutes(date, hours * 60);
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  return addHours(date, days * 24);
}

/**
 * Check if date is expired (past now)
 */
export function isExpired(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Get remaining time in seconds
 */
export function getRemainingSeconds(date: Date): number {
  const remaining = date.getTime() - Date.now();
  return Math.max(0, Math.floor(remaining / 1000));
}
