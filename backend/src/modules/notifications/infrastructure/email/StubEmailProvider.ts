/**
 * @file Provedor de e-mail stub para desenvolvimento até integrar Resend/SES.
 * @module modules/notifications/infrastructure/email/StubEmailProvider
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { redactEmail } from "../../../../shared/kernel/redactEmail";
import type { EmailProvider, SendEmailParams } from "./EmailProvider";

const CONTEXT = "StubEmailProvider";
const logger = Logger.getInstance();

/**
 * Simula envio de e-mail registrando no log.
 * Substitua por `ResendEmailProvider` ou `SesEmailProvider` em produção.
 */
export class StubEmailProvider implements EmailProvider {
  async send(params: SendEmailParams): Promise<void> {
    logger.info(CONTEXT, "Transactional email dispatched (stub)", {
      to: redactEmail(params.to),
      subject: params.subject,
      attachmentCount: params.attachments?.length ?? 0,
    });
  }
}
