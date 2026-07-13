/**
 * @file Serviço de entrega de ingressos por e-mail (PDF + transacional).
 * @module modules/notifications/application/services/deliverTicketsEmail
 */

import { In } from "typeorm";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { redactEmail } from "../../../../shared/kernel/redactEmail";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import type { EmailProvider } from "../../infrastructure/email/EmailProvider";
import { buildPurchaseConfirmationEmail } from "../../infrastructure/email/emailTemplates";
import { StubEmailProvider } from "../../infrastructure/email/StubEmailProvider";
import { ticketDeliveryJobSchema } from "../../validators/schema/ticketDeliveryJobSchema";
import {
  claimEmailDelivery,
  releaseEmailDeliveryClaim,
} from "../helpers/emailDeliveryLedger";
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
 * Revalida pedido/usuário/tickets no banco e usa ledger Redis anti-duplicata.
 */
export async function deliverTicketsEmail(
  data: TicketDeliveryJobData,
): Promise<void> {
  const parsed = validateSchema(ticketDeliveryJobSchema, data);
  const deliveryKey = `ticket-delivery:${parsed.orderId}`;

  if (!(await claimEmailDelivery(deliveryKey))) {
    logger.info(CONTEXT, "Ticket delivery skipped — already sent", {
      orderId: parsed.orderId,
    });
    return;
  }

  try {
    const order = await AppDataSource.getRepository(Order).findOne({
      where: { id: parsed.orderId },
      relations: ["user"],
    });

    if (!order?.user) {
      throw new Error(`Order or user not found for delivery: ${parsed.orderId}`);
    }

    if (order.userId !== parsed.userId) {
      throw new Error(
        `Order user mismatch for delivery: ${parsed.orderId}`,
      );
    }

    const tickets = await AppDataSource.getRepository(Ticket).find({
      where: { orderId: order.id, id: In(parsed.ticketIds) },
      select: ["id"],
      order: { id: "ASC" },
    });

    if (tickets.length !== parsed.ticketIds.length) {
      throw new Error(
        `Ticket set incomplete for order ${order.id}: expected ${parsed.ticketIds.length}, found ${tickets.length}`,
      );
    }

    if (tickets.length === 0) {
      throw new Error(`No tickets for order ${order.id}`);
    }

    const deliveryData: TicketDeliveryJobData = {
      orderId: order.id,
      userId: order.userId,
      userEmail: order.user.email,
      userName: order.user.name,
      ticketIds: tickets.map((ticket) => ticket.id),
    };

    logger.info(CONTEXT, "Delivering tickets", {
      orderId: deliveryData.orderId,
      userEmail: redactEmail(deliveryData.userEmail),
      ticketCount: deliveryData.ticketIds.length,
    });

    const pdfBuffer = await generateTicketPdf({
      orderId: deliveryData.orderId,
      userName: deliveryData.userName,
      ticketIds: deliveryData.ticketIds,
    });

    await emailProvider.send({
      to: deliveryData.userEmail,
      subject: "Seus ingressos VIBRA estão prontos",
      html: buildPurchaseConfirmationEmail(deliveryData),
      attachments: [
        {
          filename: `vibra-ingressos-${deliveryData.orderId.slice(0, 8)}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    logger.info(CONTEXT, "Tickets delivered successfully", {
      orderId: deliveryData.orderId,
      userEmail: redactEmail(deliveryData.userEmail),
    });
  } catch (error) {
    await releaseEmailDeliveryClaim(deliveryKey);
    throw error;
  }
}
