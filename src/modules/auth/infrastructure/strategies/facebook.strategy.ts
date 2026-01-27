import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';

export interface FacebookProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
}

/**
 * Facebook OAuth Strategy
 *
 * Handles Facebook OAuth2 authentication flow.
 */
@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('auth.facebook.clientId') || '';
    const clientSecret = configService.get<string>('auth.facebook.clientSecret') || '';
    const callbackURL = configService.get<string>('auth.facebook.callbackUrl') || '';

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email'],
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: FacebookProfile) => void,
  ): void {
    const { id, emails, name, photos } = profile;

    const user: FacebookProfile = {
      id,
      email: emails?.[0]?.value || '',
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      picture: photos?.[0]?.value,
    };

    done(null, user);
  }
}
