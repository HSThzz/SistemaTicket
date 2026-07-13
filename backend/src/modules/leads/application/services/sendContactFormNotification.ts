/**
 * @file Serviço de notificação externa para leads de produtores.
 * @module modules/leads/application/services/sendContactFormNotification
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { env, isProduction } from "../../../../shared/infrastructure/config/env";
import { redactEmail } from "../../../../shared/kernel/redactEmail";
import { sanitizeEmailHeader } from "../../../../shared/kernel/sanitizeEmailHeader";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import type { EmailProvider } from "../../../notifications/infrastructure/email/EmailProvider";
import {
  buildLeadAcknowledgementEmail,
  buildProducerLeadInternalEmail,
} from "../../../notifications/infrastructure/email/emailTemplates";
import { StubEmailProvider } from "../../../notifications/infrastructure/email/StubEmailProvider";
import {
  claimEmailDelivery,
  releaseEmailDeliveryClaim,
} from "../../../notifications/application/helpers/emailDeliveryLedger";
import { contactFormJobSchema } from "../../validators/schema/contactFormJobSchema";
import type { ContactFormJobData } from "../types/contactFormJob";

const CONTEXT = "SendContactFormNotification";
const logger = Logger.getInstance();

let emailProvider: EmailProvider = new StubEmailProvider();

/** Permite injetar provedor real de e-mail. */
export function setContactFormEmailProvider(provider: EmailProvider): void {
  emailProvider = provider;
}

async function sendOnce(
  deliveryKey: string,
  send: () => Promise<void>,
): Promise<void> {
  if (!(await claimEmailDelivery(deliveryKey))) {
    logger.info(CONTEXT, "Contact form email skipped — already sent", {
      deliveryKey,
    });
    return;
  }

  try {
    await send();
  } catch (error) {
    await releaseEmailDeliveryClaim(deliveryKey);
    throw error;
  }
}

/**
 * Dispara notificações externas (e-mail interno + ack ao lead).
 * Cada destinatário é idempotente via ledger Redis.
 */
export async function sendContactFormNotification(
  data: ContactFormJobData,
): Promise<void> {
  const parsed = validateSchema(contactFormJobSchema, data);

  logger.info(CONTEXT, "Processing contact form notification", {
    leadId: parsed.leadId,
    email: redactEmail(parsed.email),
  });

  const notifyTo =
    env.resend.producerLeadNotifyEmail.trim() ||
    (!isProduction ? "contato@sistematicket.local" : "");

  if (!notifyTo) {
    throw new Error("PRODUCER_LEAD_NOTIFY_EMAIL is not configured");
  }

  await sendOnce(`contact-form:internal:${parsed.leadId}`, async () => {
    await emailProvider.send({
      to: notifyTo,
      subject: sanitizeEmailHeader(
        `[VIBRA] Novo lead de produtor — ${parsed.name}`,
      ),
      html: buildProducerLeadInternalEmail(parsed),
    });
  });

  await sendOnce(`contact-form:ack:${parsed.leadId}`, async () => {
    await emailProvider.send({
      to: parsed.email,
      subject: "Recebemos seu contato — VIBRA",
      html: buildLeadAcknowledgementEmail(parsed),
    });
  });

  logger.info(CONTEXT, "Contact form notifications sent", {
    leadId: parsed.leadId,
  });
}
