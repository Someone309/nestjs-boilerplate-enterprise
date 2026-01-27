import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  IEmailService,
  SendEmailOptions,
  EmailSendResult,
  EmailAddress,
} from '@core/domain/ports/services/email.interface';

/**
 * SMTP Email Adapter
 *
 * Section 2.4: Infrastructure Layer - Email Adapter
 *
 * Uses Nodemailer for SMTP email delivery.
 * Supports template rendering with Handlebars.
 */
@Injectable()
export class SmtpEmailAdapter implements IEmailService, OnModuleInit {
  private readonly logger = new Logger(SmtpEmailAdapter.name);
  private transporter!: Transporter;
  private templates = new Map<string, Handlebars.TemplateDelegate>();
  private readonly templatesPath: string;
  private readonly fromAddress: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    this.templatesPath = path.join(__dirname, 'templates');
    this.fromAddress = this.configService.get<string>('email.from.address', 'noreply@example.com');
    this.fromName = this.configService.get<string>('email.from.name', 'NestJS App');
  }

  async onModuleInit(): Promise<void> {
    // Create transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('email.smtp.host', 'localhost'),
      port: this.configService.get<number>('email.smtp.port', 587),
      secure: this.configService.get<boolean>('email.smtp.secure', false),
      auth: {
        user: this.configService.get<string>('email.smtp.user', ''),
        pass: this.configService.get<string>('email.smtp.pass', ''),
      },
    });

    // Load templates
    await this.loadTemplates();

    this.logger.log('SMTP Email adapter initialized');
  }

  async send(options: SendEmailOptions): Promise<EmailSendResult> {
    try {
      let html = options.html;

      // Render template if specified
      if (options.template && options.context) {
        html = await this.renderTemplate(options.template, options.context);
      }

      const result = (await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to: this.formatAddresses(options.to),
        cc: options.cc ? this.formatAddresses(options.cc) : undefined,
        bcc: options.bcc ? this.formatAddresses(options.bcc) : undefined,
        replyTo: options.replyTo ? this.formatAddress(options.replyTo) : undefined,
        subject: options.subject,
        text: options.text,
        html,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
          encoding: att.encoding,
        })),
        headers: options.headers,
        priority: options.priority,
      })) as { messageId?: string };

      const messageId = result.messageId ?? '';
      this.logger.debug(`Email sent: ${messageId}`);

      return {
        success: true,
        messageId,
        response: result,
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${(error as Error).message}`);

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async sendTemplate(
    template: string,
    to: string | EmailAddress | (string | EmailAddress)[],
    subject: string,
    context: Record<string, unknown>,
  ): Promise<EmailSendResult> {
    return this.send({
      to,
      subject,
      template,
      context,
    });
  }

  async sendVerificationEmail(
    email: string,
    token: string,
    name?: string,
  ): Promise<EmailSendResult> {
    const baseUrl = this.configService.get<string>('app.baseUrl', 'http://localhost:3000');
    const verifyUrl = `${baseUrl}/auth/verify-email?token=${token}`;

    return this.sendTemplate('verification', email, 'Verify your email address', {
      name: name || 'User',
      verifyUrl,
      token,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    name?: string,
  ): Promise<EmailSendResult> {
    const baseUrl = this.configService.get<string>('app.baseUrl', 'http://localhost:3000');
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    return this.sendTemplate('password-reset', email, 'Reset your password', {
      name: name || 'User',
      resetUrl,
      token,
      expiresIn: '1 hour',
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<EmailSendResult> {
    const baseUrl = this.configService.get<string>('app.baseUrl', 'http://localhost:3000');

    return this.sendTemplate('welcome', email, 'Welcome to our platform!', {
      name,
      loginUrl: `${baseUrl}/auth/login`,
    });
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }

  private async loadTemplates(): Promise<void> {
    try {
      const files = await fs.readdir(this.templatesPath);

      for (const file of files) {
        if (file.endsWith('.hbs')) {
          const name = file.replace('.hbs', '');
          const content = await fs.readFile(path.join(this.templatesPath, file), 'utf-8');
          this.templates.set(name, Handlebars.compile(content));
          this.logger.debug(`Loaded email template: ${name}`);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to load email templates: ${(error as Error).message}`);
    }
  }

  private async renderTemplate(
    templateName: string,
    context: Record<string, unknown>,
  ): Promise<string> {
    const template = this.templates.get(templateName);

    if (!template) {
      // Try to load from file
      try {
        const content = await fs.readFile(
          path.join(this.templatesPath, `${templateName}.hbs`),
          'utf-8',
        );
        const compiled = Handlebars.compile(content);
        this.templates.set(templateName, compiled);
        return compiled(context);
      } catch {
        throw new Error(`Email template not found: ${templateName}`);
      }
    }

    return template(context);
  }

  private formatAddress(address: string | EmailAddress): string {
    if (typeof address === 'string') {
      return address;
    }
    return address.name ? `"${address.name}" <${address.email}>` : address.email;
  }

  private formatAddresses(addresses: string | EmailAddress | (string | EmailAddress)[]): string {
    if (Array.isArray(addresses)) {
      return addresses.map((a) => this.formatAddress(a)).join(', ');
    }
    return this.formatAddress(addresses);
  }
}
