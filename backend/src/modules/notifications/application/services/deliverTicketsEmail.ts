/**
 * @file Serviço de entrega de ingressos por e-mail (PDF + transacional).
 * @module modules/notifications/application/services/deliverTicketsEmail
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import type { EmailProvider } from "../../infrastructure/email/EmailProvider";
import { StubEmailProvider } from "../../infrastructure/email/StubEmailProvider";
import type { TicketDeliveryJobData } from "../types/ticketDeliveryJob";
import { generateTicketPdf } from "./generateTicketPdf";

const CONTEXT = "DeliverTicketsEmail";
const logger = Logger.getInstance();

let emailProvider: EmailProvider = new StubEmailProvider();

/**
 * Permite injetar o provedor real (Resend, AWS SES) em bootstrap ou testes.
 */
export function setEmailProvider(provider: EmailProvider): void {
  emailProvider = provider;
}

/**
 * Gera PDF dos ingressos e dispara e-mail transacional de confirmação.
 */
export async function deliverTicketsEmail(
  data: TicketDeliveryJobData,
): Promise<void> {
  logger.info(CONTEXT, "Delivering tickets", {
    orderId: data.orderId,
    userEmail: data.userEmail,
    ticketCount: data.ticketIds.length,
  });

  const pdfBuffer = await generateTicketPdf({
    orderId: data.orderId,
    userName: data.userName,
    ticketIds: data.ticketIds,
  });

  await emailProvider.send({
    to: data.userEmail,
    subject: "Seus ingressos estão prontos!",
    html: buildPurchaseConfirmationHtml(data),
    attachments: [
      {
        filename: `ingressos-${data.orderId}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  logger.info(CONTEXT, "Tickets delivered successfully", {
    orderId: data.orderId,
    userEmail: data.userEmail,
  });
}

function buildPurchaseConfirmationHtml(data: TicketDeliveryJobData): string {
  return `
    <p>Olá, ${escapeHtml(data.userName)}!</p>
    <p>Sua compra foi confirmada. Em anexo estão os ${data.ticketIds.length} ingresso(s) do pedido <strong>${escapeHtml(data.orderId)}</strong>.</p>
    <p>Apresente o PDF na entrada do evento.</p>
  `.trim();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
