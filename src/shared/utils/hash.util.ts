import { createHash, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Hash Utility Functions
 *
 * Security: Use bcrypt for passwords (Section 7.4)
 * These utilities are for non-password hashing needs
 */

/**
 * Create SHA256 hash of a string
 */
export function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Create SHA512 hash of a string
 */
export function sha512(data: string): string {
  return createHash('sha512').update(data).digest('hex');
}

/**
 * Generate cryptographically secure random bytes as hex string
 */
export function randomHex(length = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate cryptographically secure random bytes as base64 string
 */
export function randomBase64(length = 32): string {
  return randomBytes(length).toString('base64');
}

/**
 * Generate URL-safe random string
 */
export function randomUrlSafe(length = 32): string {
  return randomBytes(length).toString('base64url');
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  return timingSafeEqual(bufA, bufB);
}

/**
 * Generate a token for password reset, email verification, etc.
 * @param length Byte length (default: 48, results in ~64 characters base64url)
 */
export function generateToken(length = 48): string {
  return randomUrlSafe(length);
}
