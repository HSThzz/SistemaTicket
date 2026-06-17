/**
 * @file Serviço de notificação externa para leads de produtores.
 * @module modules/leads/application/services/sendContactFormNotification
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { env } from "../../../../shared/infrastructure/config/env";
import type { EmailProvider } from "../../../notifications/infrastructure/email/EmailProvider";
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
 * Estruturado para plugar Resend/SES e webhooks futuros.
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
    subject: `[Novo lead produtor] ${data.name}`,
    html: buildInternalNotificationHtml(data),
  });

  await emailProvider.send({
    to: data.email,
    subject: "Recebemos seu contato — SistemaTicket",
    html: buildLeadAcknowledgementHtml(data),
  });

  logger.info(CONTEXT, "Contact form notifications sent", {
    leadId: data.leadId,
  });
}

function buildInternalNotificationHtml(data: ContactFormJobData): string {
  const phoneLine = data.phone
    ? `<li><strong>Telefone:</strong> ${escapeHtml(data.phone)}</li>`
    : "";

  return `
    <p>Novo lead capturado pelo formulário de produtores:</p>
    <ul>
      <li><strong>ID:</strong> ${escapeHtml(data.leadId)}</li>
      <li><strong>Nome:</strong> ${escapeHtml(data.name)}</li>
      <li><strong>E-mail:</strong> ${escapeHtml(data.email)}</li>
      ${phoneLine}
    </ul>
  `.trim();
}

function buildLeadAcknowledgementHtml(data: ContactFormJobData): string {
  return `
    <p>Olá, ${escapeHtml(data.name)}!</p>
    <p>Recebemos sua mensagem. Nossa equipe entrará em contato em até 1 dia útil.</p>
  `.trim();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
