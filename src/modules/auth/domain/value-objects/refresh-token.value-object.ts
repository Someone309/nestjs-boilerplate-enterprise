import { ValueObject } from '@core/domain/base';
import { generateToken } from '@shared/utils';

/**
 * Refresh Token Value Object Props
 */
interface RefreshTokenProps {
  token: string;
  userId: string;
  expiresAt: Date;
  issuedAt: Date;
}

/**
 * Refresh Token Value Object
 *
 * Represents a refresh token for JWT authentication.
 *
 * Section 7.4: Security - JWT tokens
 */
export class RefreshToken extends ValueObject<RefreshTokenProps> {
  private constructor(props: RefreshTokenProps) {
    super(props);
  }

  /**
   * Create a new refresh token
   */
  static create(userId: string, expiresInSeconds: number): RefreshToken {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000);

    return new RefreshToken({
      token: generateToken(64),
      userId,
      expiresAt,
      issuedAt: now,
    });
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(props);
  }

  get token(): string {
    return this.props.token;
  }

  get userId(): string {
    return this.props.userId;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get issuedAt(): Date {
    return this.props.issuedAt;
  }

  get isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }
}
