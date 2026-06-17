/**
 * @file Serviço de notificação externa para leads de produtores.
 * @module modules/leads/application/services/sendContactFormNotification
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { env } from "../../../../shared/infrastructure/config/env";
import type { EmailProvider } from "../../../notifications/infrastructure/email/EmailProvider";
import {
  buildLeadAcknowledgementEmail,
  buildProducerLeadInternalEmail,
} from "../../../notifications/infrastructure/email/emailTemplates";
import { StubEmailProvider } from "../../../notifications/infrastructure/email/StubEmailProvider";
import type { ContactFormJobData } from "../types/contactFormJob";

const CONTEXT = "SendContactFormNotification";
const logger = Logger.getInstance();

let emailProvider: EmailProvider = new StubEmailProvider();

/** Permite injetar provedor real de e-mail. */
export function setContactFormEmailProvider(provider: EmailProvider): void {
  emailProvider = provider;
}

/**
 * Dispara notificações externas (e-mail interno, alertas, integrações CRM).
 */
export async function sendContactFormNotification(
  data: ContactFormJobData,
): Promise<void> {
  logger.info(CONTEXT, "Processing contact form notification", {
    leadId: data.leadId,
    email: data.email,
  });

  await emailProvider.send({
    to:
      env.resend.producerLeadNotifyEmail.trim() ||
      "contato@sistematicket.local",
    subject: `[VIBRA] Novo lead de produtor — ${data.name}`,
    html: buildProducerLeadInternalEmail(data),
  });

  await emailProvider.send({
    to: data.email,
    subject: "Recebemos seu contato — VIBRA",
    html: buildLeadAcknowledgementEmail(data),
  });

  logger.info(CONTEXT, "Contact form notifications sent", {
    leadId: data.leadId,
  });
}
