/**
 * Input Sanitization Utilities
 *
 * Section 2.1: Input Sanitization Rules
 * - Trim whitespace
 * - XSS filtering
 * - Path traversal prevention
 * - Null byte injection prevention
 */

// Control character regex patterns (eslint-disable for intentional control character matching)
/* eslint-disable no-control-regex */
const CONTROL_CHARS_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const CONTROL_CHARS_WITH_NULL_PATTERN = /[\u0000-\u001F\u007F]/g;
/* eslint-enable no-control-regex */

/**
 * Sanitize string input
 * Removes dangerous characters and trims whitespace
 */
export function sanitizeString(input: string | null | undefined): string {
  if (input === null || input === undefined) {
    return '';
  }

  return (
    input
      .trim()
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove control characters except newlines and tabs
      .replace(CONTROL_CHARS_PATTERN, '')
  );
}

/**
 * Sanitize HTML content
 * Removes all HTML tags for plain text fields
 */
export function stripHtml(input: string | null | undefined): string {
  if (input === null || input === undefined) {
    return '';
  }

  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Escape HTML special characters
 * Use for displaying user input in HTML context
 */
export function escapeHtml(input: string | null | undefined): string {
  if (input === null || input === undefined) {
    return '';
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitize file path
 * Prevents path traversal attacks
 */
export function sanitizePath(input: string | null | undefined): string {
  if (input === null || input === undefined) {
    return '';
  }

  return (
    input
      // Remove path traversal sequences
      .replace(/\.\./g, '')
      .replace(/\.\//g, '')
      // Remove null bytes
      .replace(/\0/g, '')
      // Normalize slashes
      .replace(/\\/g, '/')
      // Remove leading slash
      .replace(/^\/+/, '')
      // Remove multiple consecutive slashes
      .replace(/\/+/g, '/')
      .trim()
  );
}

/**
 * Sanitize filename
 * Removes dangerous characters from filenames
 */
export function sanitizeFilename(input: string | null | undefined): string {
  if (input === null || input === undefined) {
    return '';
  }

  return (
    input
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove path separators
      .replace(/[/\\]/g, '')
      // Remove potentially dangerous characters
      .replace(/[<>:"|?*]/g, '')
      // Remove control characters
      .replace(CONTROL_CHARS_WITH_NULL_PATTERN, '')
      .trim()
  );
}

/**
 * Sanitize SQL identifier (table/column names)
 * Only allows alphanumeric and underscore
 */
export function sanitizeSqlIdentifier(input: string | null | undefined): string {
  if (input === null || input === undefined) {
    return '';
  }

  return input.replace(/[^a-zA-Z0-9_]/g, '');
}

/**
 * Sanitize URL
 * Removes dangerous protocols and characters
 */
export function sanitizeUrl(input: string | null | undefined): string {
  if (input === null || input === undefined) {
    return '';
  }

  const trimmed = input.trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return '';
    }
  }

  return input.trim();
}

/**
 * Sanitize email for logging/display
 * Partially masks the email address
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) {
    return '';
  }

  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) {
    return '***';
  }

  const maskedLocal =
    localPart.length <= 2
      ? '*'.repeat(localPart.length)
      : localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1];

  return `${maskedLocal}@${domain}`;
}

/**
 * Check if string contains potential XSS
 */
export function containsXss(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick=, onerror=, etc.
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<svg.*?onload/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Check if string contains SQL injection patterns
 */
export function containsSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b.*\b(FROM|INTO|TABLE|SET|VALUES)\b)/gi,
    /(-{2}|\/\*|\*\/)/g, // SQL comments
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/gi, // OR 1=1, AND 1=1
    /(';|";|`)/g, // Quote followed by semicolon
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}
