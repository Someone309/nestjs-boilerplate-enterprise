import { ValueObject, BusinessRuleViolationException } from '@core/domain/base';

/**
 * Email Value Object Props
 */
interface EmailProps {
  value: string;
}

/**
 * Email Value Object
 *
 * Encapsulates email validation and normalization.
 *
 * Section 2.3: Domain Layer - ValueObject has no ID, equality by value
 */
export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  /**
   * Create an email value object
   * @throws BusinessRuleViolationException if email is invalid
   */
  static create(email: string): Email {
    const normalized = email.toLowerCase().trim();

    if (!normalized) {
      throw new BusinessRuleViolationException('Email is required');
    }

    if (!this.EMAIL_REGEX.test(normalized)) {
      throw new BusinessRuleViolationException('Invalid email format');
    }

    if (normalized.length > 255) {
      throw new BusinessRuleViolationException('Email must not exceed 255 characters');
    }

    return new Email({ value: normalized });
  }

  /**
   * Get the email value
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * Get the local part (before @)
   */
  get localPart(): string {
    return this.props.value.split('@')[0];
  }

  /**
   * Get the domain part (after @)
   */
  get domain(): string {
    return this.props.value.split('@')[1];
  }

  /**
   * Get masked email for display
   */
  get masked(): string {
    const [local, domain] = this.props.value.split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  }
}
