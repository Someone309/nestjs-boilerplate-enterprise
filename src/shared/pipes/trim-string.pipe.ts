import { PipeTransform, Injectable } from '@nestjs/common';

/**
 * Trim String Pipe
 *
 * Trims whitespace from string values
 * Input sanitization rule (Section 2.1)
 */
@Injectable()
export class TrimStringPipe implements PipeTransform {
  transform(value: unknown): unknown {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'object' && value !== null) {
      return this.trimObject(value as Record<string, unknown>);
    }

    return value;
  }

  private trimObject(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = value.trim();
      } else if (Array.isArray(value)) {
        result[key] = (value as unknown[]).map((item: unknown) =>
          typeof item === 'string' ? item.trim() : item,
        );
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.trimObject(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}
