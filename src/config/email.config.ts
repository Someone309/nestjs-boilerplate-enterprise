import { registerAs } from '@nestjs/config';

/**
 * Email Configuration
 *
 * Environment variables:
 * - EMAIL_SMTP_HOST: SMTP server host
 * - EMAIL_SMTP_PORT: SMTP server port (default: 587)
 * - EMAIL_SMTP_SECURE: Use TLS (default: false)
 * - EMAIL_SMTP_USER: SMTP username
 * - EMAIL_SMTP_PASS: SMTP password
 * - EMAIL_FROM_ADDRESS: Default from email address
 * - EMAIL_FROM_NAME: Default from name
 */
export const emailConfig = registerAs('email', () => ({
  smtp: {
    host: process.env.EMAIL_SMTP_HOST || 'localhost',
    port: parseInt(process.env.EMAIL_SMTP_PORT || '587', 10),
    secure: process.env.EMAIL_SMTP_SECURE === 'true',
    user: process.env.EMAIL_SMTP_USER || '',
    pass: process.env.EMAIL_SMTP_PASS || '',
  },
  from: {
    address: process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com',
    name: process.env.EMAIL_FROM_NAME || 'NestJS App',
  },
}));

export type EmailConfig = ReturnType<typeof emailConfig>;
