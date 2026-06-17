/**
 * @file Serviço de entrega de ingressos por e-mail (PDF + transacional).
 * @module modules/notifications/application/services/deliverTicketsEmail
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import type { EmailProvider } from "../../infrastructure/email/EmailProvider";
import { buildPurchaseConfirmationEmail } from "../../infrastructure/email/emailTemplates";
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
    subject: "Seus ingressos VIBRA estão prontos",
    html: buildPurchaseConfirmationEmail(data),
    attachments: [
      {
        filename: `vibra-ingressos-${data.orderId.slice(0, 8)}.pdf`,
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
