import { Global, Module } from '@nestjs/common';
import { EMAIL_SERVICE } from '@core/domain/ports/services/email.interface';
import { SmtpEmailAdapter } from './smtp.adapter';

/**
 * Email Module
 *
 * Provides email sending capabilities via SMTP.
 *
 * Features:
 * - SMTP email delivery via Nodemailer
 * - Handlebars template rendering
 * - Built-in templates for common emails
 * - Async sending support
 */
@Global()
@Module({
  providers: [
    SmtpEmailAdapter,
    {
      provide: EMAIL_SERVICE,
      useExisting: SmtpEmailAdapter,
    },
  ],
  exports: [EMAIL_SERVICE, SmtpEmailAdapter],
})
export class EmailModule {}
