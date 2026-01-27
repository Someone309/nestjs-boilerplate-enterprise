import { Transform, type TransformFnParams } from 'class-transformer';
import {
  sanitizeString,
  stripHtml,
  sanitizePath,
  sanitizeFilename,
  sanitizeUrl,
} from './sanitize.util';

/**
 * Sanitization Decorators for DTOs
 *
 * Section 2.1: Input Sanitization Rules
 * Use these decorators in DTOs to automatically sanitize input
 */

/**
 * Trim whitespace and remove null bytes
 *
 * @example
 * class CreateUserDto {
 *   @Sanitize()
 *   @IsString()
 *   name: string;
 * }
 */
export function Sanitize(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? sanitizeString(value) : (value as unknown),
  );
}

/**
 * Strip all HTML tags from input
 *
 * @example
 * class CommentDto {
 *   @StripHtml()
 *   @IsString()
 *   content: string;
 * }
 */
export function StripHtml(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? stripHtml(value) : (value as unknown),
  );
}

/**
 * Sanitize file path (prevent path traversal)
 *
 * @example
 * class FileDto {
 *   @SanitizePath()
 *   @IsString()
 *   path: string;
 * }
 */
export function SanitizePath(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? sanitizePath(value) : (value as unknown),
  );
}

/**
 * Sanitize filename (remove dangerous characters)
 *
 * @example
 * class UploadDto {
 *   @SanitizeFilename()
 *   @IsString()
 *   filename: string;
 * }
 */
export function SanitizeFilename(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? sanitizeFilename(value) : (value as unknown),
  );
}

/**
 * Sanitize URL (block dangerous protocols)
 *
 * @example
 * class LinkDto {
 *   @SanitizeUrl()
 *   @IsUrl()
 *   url: string;
 * }
 */
export function SanitizeUrl(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? sanitizeUrl(value) : (value as unknown),
  );
}

/**
 * Convert to lowercase and trim
 *
 * @example
 * class LoginDto {
 *   @ToLowerCase()
 *   @IsEmail()
 *   email: string;
 * }
 */
export function ToLowerCase(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.toLowerCase().trim() : (value as unknown),
  );
}

/**
 * Convert to uppercase and trim
 *
 * @example
 * class CountryDto {
 *   @ToUpperCase()
 *   @IsString()
 *   code: string;
 * }
 */
export function ToUpperCase(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.toUpperCase().trim() : (value as unknown),
  );
}

/**
 * Trim whitespace only
 *
 * @example
 * class SearchDto {
 *   @Trim()
 *   @IsString()
 *   query: string;
 * }
 */
export function Trim(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  );
}
