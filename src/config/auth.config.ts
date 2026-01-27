import { registerAs } from '@nestjs/config';

/**
 * Auth Configuration
 *
 * Environment variables:
 * - AUTH_EMAIL_VERIFICATION_EXPIRES: Email verification token expiry (default: 24h)
 * - AUTH_PASSWORD_RESET_EXPIRES: Password reset token expiry (default: 1h)
 * - AUTH_GOOGLE_CLIENT_ID: Google OAuth client ID
 * - AUTH_GOOGLE_CLIENT_SECRET: Google OAuth client secret
 * - AUTH_GOOGLE_CALLBACK_URL: Google OAuth callback URL
 * - AUTH_FACEBOOK_CLIENT_ID: Facebook App ID
 * - AUTH_FACEBOOK_CLIENT_SECRET: Facebook App secret
 * - AUTH_FACEBOOK_CALLBACK_URL: Facebook callback URL
 * - AUTH_APPLE_CLIENT_ID: Apple Services ID
 * - AUTH_APPLE_TEAM_ID: Apple Team ID
 * - AUTH_APPLE_KEY_ID: Apple Key ID
 * - AUTH_APPLE_PRIVATE_KEY: Apple private key (base64 encoded)
 * - AUTH_APPLE_CALLBACK_URL: Apple callback URL
 */
export const authConfig = registerAs('auth', () => ({
  emailVerificationExpiresIn: process.env.AUTH_EMAIL_VERIFICATION_EXPIRES || '24h',
  passwordResetExpiresIn: process.env.AUTH_PASSWORD_RESET_EXPIRES || '1h',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  google: {
    clientId: process.env.AUTH_GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET || '',
    callbackUrl:
      process.env.AUTH_GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
    enabled: !!(process.env.AUTH_GOOGLE_CLIENT_ID && process.env.AUTH_GOOGLE_CLIENT_SECRET),
  },
  facebook: {
    clientId: process.env.AUTH_FACEBOOK_CLIENT_ID || '',
    clientSecret: process.env.AUTH_FACEBOOK_CLIENT_SECRET || '',
    callbackUrl:
      process.env.AUTH_FACEBOOK_CALLBACK_URL || 'http://localhost:3000/api/auth/facebook/callback',
    enabled: !!(process.env.AUTH_FACEBOOK_CLIENT_ID && process.env.AUTH_FACEBOOK_CLIENT_SECRET),
  },
  apple: {
    clientId: process.env.AUTH_APPLE_CLIENT_ID || '',
    teamId: process.env.AUTH_APPLE_TEAM_ID || '',
    keyId: process.env.AUTH_APPLE_KEY_ID || '',
    privateKey: process.env.AUTH_APPLE_PRIVATE_KEY
      ? Buffer.from(process.env.AUTH_APPLE_PRIVATE_KEY, 'base64').toString('utf-8')
      : '',
    callbackUrl:
      process.env.AUTH_APPLE_CALLBACK_URL || 'http://localhost:3000/api/auth/apple/callback',
    enabled: !!(
      process.env.AUTH_APPLE_CLIENT_ID &&
      process.env.AUTH_APPLE_TEAM_ID &&
      process.env.AUTH_APPLE_KEY_ID &&
      process.env.AUTH_APPLE_PRIVATE_KEY
    ),
  },
}));

export type AuthConfig = ReturnType<typeof authConfig>;
