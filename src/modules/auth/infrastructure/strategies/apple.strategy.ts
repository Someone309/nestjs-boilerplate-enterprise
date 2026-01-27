import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const AppleStrategy: new (...args: unknown[]) => unknown = require('passport-apple');

export interface AppleProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
}

interface AppleIdToken {
  sub: string;
  email?: string;
  email_verified?: boolean | string;
}

/**
 * Apple OAuth Strategy
 *
 * Handles Sign in with Apple authentication flow.
 */
@Injectable()
export class ApplePassportStrategy extends PassportStrategy(AppleStrategy, 'apple') {
  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('auth.apple.clientId') || '';
    const teamID = configService.get<string>('auth.apple.teamId') || '';
    const keyID = configService.get<string>('auth.apple.keyId') || '';
    const privateKey = configService.get<string>('auth.apple.privateKey') || '';
    const callbackURL = configService.get<string>('auth.apple.callbackUrl') || '';

    super({
      clientID,
      teamID,
      keyID,
      privateKeyString: privateKey,
      callbackURL,
      scope: ['email', 'name'],
      passReqToCallback: false,
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    idToken: AppleIdToken,
    profile: { name?: { firstName?: string; lastName?: string } },
    done: (error: Error | null, user?: AppleProfile) => void,
  ): void {
    // Apple only provides name on first sign in
    // Subsequent sign ins only include the email
    const user: AppleProfile = {
      id: idToken.sub,
      email: idToken.email || '',
      firstName: profile?.name?.firstName || '',
      lastName: profile?.name?.lastName || '',
      emailVerified: idToken.email_verified === 'true' || idToken.email_verified === true,
    };

    done(null, user);
  }
}
