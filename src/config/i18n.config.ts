import { registerAs } from '@nestjs/config';

/**
 * I18n Configuration
 *
 * Internationalization settings for the application.
 * Supports multiple languages with automatic detection.
 */
export const i18nConfig = registerAs('i18n', () => ({
  // Default language when no language is detected
  defaultLanguage: process.env.I18N_DEFAULT_LANGUAGE || 'en',

  // Fallback language when translation is missing
  fallbackLanguage: process.env.I18N_FALLBACK_LANGUAGE || 'en',

  // Supported languages (comma-separated in env)
  supportedLanguages: process.env.I18N_SUPPORTED_LANGUAGES?.split(',') || ['en', 'es'],

  // Path to translation files (relative to cwd)
  translationsPath: process.env.I18N_TRANSLATIONS_PATH || 'src/infrastructure/i18n/translations',
}));

export type I18nConfig = ReturnType<typeof i18nConfig>;
