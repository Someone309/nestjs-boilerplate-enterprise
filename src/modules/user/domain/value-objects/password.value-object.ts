import * as bcrypt from 'bcrypt';
import { ValueObject, BusinessRuleViolationException } from '@core/domain/base';

/**
 * Password Value Object Props
 */
interface PasswordProps {
  hashedValue: string;
}

/**
 * Password Value Object
 *
 * Encapsulates password hashing and validation using bcrypt.
 * Stores only the hashed value, never the plain text.
 *
 * Section 2.3: Domain Layer - ValueObject
 * Section 7.4: Security - bcrypt for password hashing
 */
export class Password extends ValueObject<PasswordProps> {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;
  private static readonly SALT_ROUNDS = 12;

  private constructor(props: PasswordProps) {
    super(props);
  }

  /**
   * Create a password from plain text (async)
   * This should only be used when creating/updating passwords
   * @throws BusinessRuleViolationException if password doesn't meet requirements
   */
  static async create(plainPassword: string): Promise<Password> {
    this.validatePlainPassword(plainPassword);

    const hashedValue = await bcrypt.hash(plainPassword, this.SALT_ROUNDS);
    return new Password({ hashedValue });
  }

  /**
   * Create a password from plain text (sync - for compatibility)
   * Uses bcrypt.hashSync which blocks the event loop - avoid in production
   * @throws BusinessRuleViolationException if password doesn't meet requirements
   */
  static createSync(plainPassword: string): Password {
    this.validatePlainPassword(plainPassword);

    const hashedValue = bcrypt.hashSync(plainPassword, this.SALT_ROUNDS);
    return new Password({ hashedValue });
  }

  /**
   * Create a password from already hashed value
   * Used when reconstituting from persistence
   */
  static fromHash(hashedValue: string): Password {
    if (!hashedValue) {
      throw new BusinessRuleViolationException('Hashed password is required');
    }
    return new Password({ hashedValue });
  }

  /**
   * Get the hashed password value
   */
  get hashedValue(): string {
    return this.props.hashedValue;
  }

  /**
   * Verify a plain password against the hash (async)
   */
  async verifyAsync(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.props.hashedValue);
  }

  /**
   * Verify a plain password against the hash (sync - for compatibility)
   * Uses bcrypt.compareSync which blocks the event loop - avoid in production
   */
  verify(plainPassword: string): boolean {
    return bcrypt.compareSync(plainPassword, this.props.hashedValue);
  }

  /**
   * Validate password requirements
   */
  private static validatePlainPassword(password: string): void {
    if (!password) {
      throw new BusinessRuleViolationException('Password is required');
    }

    if (password.length < this.MIN_LENGTH) {
      throw new BusinessRuleViolationException(
        `Password must be at least ${this.MIN_LENGTH} characters`,
      );
    }

    if (password.length > this.MAX_LENGTH) {
      throw new BusinessRuleViolationException(
        `Password must not exceed ${this.MAX_LENGTH} characters`,
      );
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new BusinessRuleViolationException(
        'Password must contain at least one uppercase letter',
      );
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new BusinessRuleViolationException(
        'Password must contain at least one lowercase letter',
      );
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      throw new BusinessRuleViolationException('Password must contain at least one number');
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      throw new BusinessRuleViolationException(
        'Password must contain at least one special character',
      );
    }
  }
}
