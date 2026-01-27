/**
 * Email Service Interface (Port)
 *
 * Section 2.4: Infrastructure Layer - Ports & Adapters
 *
 * Defines the contract for email sending operations.
 */

/**
 * Email address with optional name
 */
export interface EmailAddress {
  email: string;
  name?: string;
}

/**
 * Email attachment
 */
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  encoding?: 'base64' | 'utf-8';
}

/**
 * Email options
 */
export interface SendEmailOptions {
  /** Recipient(s) */
  to: string | EmailAddress | (string | EmailAddress)[];
  /** CC recipients */
  cc?: string | EmailAddress | (string | EmailAddress)[];
  /** BCC recipients */
  bcc?: string | EmailAddress | (string | EmailAddress)[];
  /** Email subject */
  subject: string;
  /** Plain text content */
  text?: string;
  /** HTML content */
  html?: string;
  /** Template name */
  template?: string;
  /** Template context/variables */
  context?: Record<string, unknown>;
  /** Attachments */
  attachments?: EmailAttachment[];
  /** Reply-to address */
  replyTo?: string | EmailAddress;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Priority (high, normal, low) */
  priority?: 'high' | 'normal' | 'low';
  /** Tags for tracking */
  tags?: string[];
}

/**
 * Email send result
 */
export interface EmailSendResult {
  /** Was sending successful */
  success: boolean;
  /** Message ID from provider */
  messageId?: string;
  /** Error message if failed */
  error?: string;
  /** Provider-specific response */
  response?: unknown;
}

/**
 * Email Service Port
 */
export interface IEmailService {
  /**
   * Send an email
   */
  send(options: SendEmailOptions): Promise<EmailSendResult>;

  /**
   * Send email using a template
   */
  sendTemplate(
    template: string,
    to: string | EmailAddress | (string | EmailAddress)[],
    subject: string,
    context: Record<string, unknown>,
  ): Promise<EmailSendResult>;

  /**
   * Send verification email
   */
  sendVerificationEmail(email: string, token: string, name?: string): Promise<EmailSendResult>;

  /**
   * Send password reset email
   */
  sendPasswordResetEmail(email: string, token: string, name?: string): Promise<EmailSendResult>;

  /**
   * Send welcome email
   */
  sendWelcomeEmail(email: string, name: string): Promise<EmailSendResult>;

  /**
   * Verify email service connection
   */
  verify(): Promise<boolean>;
}

/**
 * Email service injection token
 */
export const EMAIL_SERVICE = Symbol('IEmailService');
