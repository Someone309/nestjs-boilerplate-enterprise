/**
 * Data Masking Utilities
 *
 * Sensitive data masking for logs (Section 12.7)
 */

/**
 * Mask email address
 * john.doe@example.com -> j***@example.com
 */
export function maskEmail(email: string): string {
  if (!email?.includes('@')) {
    return '[INVALID_EMAIL]';
  }

  const [local, domain] = email.split('@');
  if (local.length <= 1) {
    return `*@${domain}`;
  }

  return `${local[0]}***@${domain}`;
}

/**
 * Mask phone number
 * 555-123-4567 -> ***-***-4567
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) {
    return '[INVALID_PHONE]';
  }

  const lastFour = phone.slice(-4);
  const maskedPart = phone.slice(0, -4).replace(/\d/g, '*');
  return maskedPart + lastFour;
}

/**
 * Mask credit card number
 * 1234567890123456 -> ****-****-****-3456
 */
export function maskCreditCard(cardNumber: string): string {
  const digitsOnly = cardNumber.replace(/\D/g, '');

  if (digitsOnly.length < 4) {
    return '[INVALID_CARD]';
  }

  const lastFour = digitsOnly.slice(-4);
  return `****-****-****-${lastFour}`;
}

/**
 * Mask SSN/ID
 * 123-45-6789 -> ***-**-6789
 */
export function maskSSN(ssn: string): string {
  const digitsOnly = ssn.replace(/\D/g, '');

  if (digitsOnly.length < 4) {
    return '[INVALID_SSN]';
  }

  const lastFour = digitsOnly.slice(-4);
  return `***-**-${lastFour}`;
}

/**
 * Mask API key
 * sk_live_abc123xyz789 -> ****...z789
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '[REDACTED]';
  }

  const lastFour = apiKey.slice(-4);
  return `****...${lastFour}`;
}

/**
 * Redact sensitive value completely
 */
export function redact(): string {
  return '[REDACTED]';
}

/**
 * Sensitive field patterns for automatic masking
 */
const SENSITIVE_PATTERNS: {
  pattern: RegExp;
  mask: (value: string) => string;
}[] = [
  { pattern: /password/i, mask: redact },
  { pattern: /token/i, mask: redact },
  { pattern: /secret/i, mask: redact },
  { pattern: /authorization/i, mask: redact },
  { pattern: /apiKey/i, mask: maskApiKey },
  { pattern: /api_key/i, mask: maskApiKey },
  { pattern: /email/i, mask: maskEmail },
  { pattern: /phone/i, mask: maskPhone },
  { pattern: /creditCard/i, mask: maskCreditCard },
  { pattern: /cardNumber/i, mask: maskCreditCard },
  { pattern: /ssn/i, mask: maskSSN },
];

/**
 * Recursively mask sensitive data in an object
 * Used for logging (Section 12.7)
 */
export function maskSensitiveData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item: unknown) => maskSensitiveData(item)) as T;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const sensitivePattern = SENSITIVE_PATTERNS.find((p) => p.pattern.test(key));

    if (sensitivePattern && typeof value === 'string') {
      result[key] = sensitivePattern.mask(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = maskSensitiveData(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}
