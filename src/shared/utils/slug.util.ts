/**
 * Slug Utilities
 *
 * Utility functions for generating URL-safe slugs.
 */

/**
 * Generate a URL-safe slug from a string
 * @param text The text to convert to a slug
 * @returns URL-safe slug
 *
 * @example
 * generateSlug('Hello World!') // 'hello-world'
 * generateSlug('My Company Inc.') // 'my-company-inc'
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug by appending a random suffix
 * @param text The text to convert to a slug
 * @returns URL-safe slug with random suffix
 *
 * @example
 * generateUniqueSlug('Hello World!') // 'hello-world-abc123'
 */
export function generateUniqueSlug(text: string): string {
  const baseSlug = generateSlug(text);
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${suffix}`;
}

/**
 * Validate if a string is a valid slug
 * @param slug The slug to validate
 * @returns True if valid slug
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}
