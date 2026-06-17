/**
 * @file Provedor de e-mail transacional via Resend.
 * @module modules/notifications/infrastructure/email/ResendEmailProvider
 */

import { Resend } from "resend";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import type { EmailProvider, SendEmailParams } from "./EmailProvider";

const CONTEXT = "ResendEmailProvider";

/**
 * Envia e-mails transacionais usando a API do Resend.
 */
export class ResendEmailProvider implements EmailProvider {
  private readonly client: Resend;
  private readonly logger = Logger.getInstance();

  /**
   * @param apiKey - Chave da API Resend (`re_...`).
   * @param from - Remetente no formato `Nome <email@dominio.com>`.
   */
  constructor(apiKey: string, private readonly from: string) {
    this.client = new Resend(apiKey);
  }

  async send(params: SendEmailParams): Promise<void> {
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      attachments: params.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content.toString("base64"),
      })),
    });

    if (error) {
      this.logger.error(CONTEXT, "Resend API rejected email", {
        to: params.to,
        subject: params.subject,
        message: error.message,
        name: error.name,
      });
      throw new Error(`Resend: ${error.message}`);
    }

    this.logger.info(CONTEXT, "Email sent via Resend", {
      to: params.to,
      subject: params.subject,
      resendId: data?.id,
    });
  }
}
