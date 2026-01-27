import { PipeTransform, Injectable } from '@nestjs/common';

/**
 * Sanitize Pipe
 *
 * Removes potentially dangerous characters from input
 * Input sanitization rules (Section 2.1):
 * - Null byte injection: Strip \0 characters
 * - Path traversal: Validate no ../ in paths
 *
 * Note: XSS filtering for rich text should use sanitize-html package
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: unknown): unknown {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value as Record<string, unknown>);
    }

    return value;
  }

  private sanitizeString(str: string): string {
    // Remove null bytes
    let sanitized = str.replace(/\0/g, '');

    // Remove potential path traversal sequences
    sanitized = sanitized.replace(/\.\.[\\/]/g, '');

    return sanitized;
  }

  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key as well
      const sanitizedKey = this.sanitizeString(key);

      if (typeof value === 'string') {
        result[sanitizedKey] = this.sanitizeString(value);
      } else if (Array.isArray(value)) {
        result[sanitizedKey] = (value as unknown[]).map((item: unknown) =>
          typeof item === 'string' ? this.sanitizeString(item) : item,
        );
      } else if (typeof value === 'object' && value !== null) {
        result[sanitizedKey] = this.sanitizeObject(value as Record<string, unknown>);
      } else {
        result[sanitizedKey] = value;
      }
    }

    return result;
  }
}
