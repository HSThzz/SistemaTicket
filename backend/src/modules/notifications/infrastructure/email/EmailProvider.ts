/**
 * @file Contrato do provedor de e-mail transacional (Resend, AWS SES, etc.).
 * @module modules/notifications/infrastructure/email/EmailProvider
 */

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
};

/** Abstração para plugar SDK de e-mail transacional. */
export interface EmailProvider {
  send(params: SendEmailParams): Promise<void>;
}
