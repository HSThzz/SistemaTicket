/**
 * @file Command: enfileira entrega assíncrona de ingressos após pagamento confirmado.
 * @module modules/notifications/application/commands/enqueueTicketDelivery
 */

import { In } from "typeorm";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { isDuplicateJobError } from "../../../../shared/infrastructure/messaging/isDuplicateJobError";
import type { ProcessPaymentSucceededResult } from "../../../payment/application/commands/processPaymentSucceeded";
import { getTicketDeliveryQueue } from "../../infrastructure/queues/ticketDeliveryQueue";

const CONTEXT = "EnqueueTicketDelivery";
const logger = Logger.getInstance();

export type EnqueueTicketDeliveryInput = {
  id: string;
  ticketIds?: string[];
};

/**
 * Adiciona job na fila `ticket-delivery` com `jobId` determinístico.
 * Propaga erro de enqueue (exceto job duplicado) para o caller retentar.
 */
export async function enqueueTicketDelivery(
  result: EnqueueTicketDeliveryInput | Pick<ProcessPaymentSucceededResult, "id" | "ticketIds">,
): Promise<void> {
  const order = await AppDataSource.getRepository(Order).findOne({
    where: { id: result.id },
    relations: ["user"],
  });

  if (!order?.user) {
    logger.error(CONTEXT, "Order or user not found — ticket delivery skipped", {
      orderId: result.id,
    });
    return;
  }

  let ticketIds = result.ticketIds ?? [];

  if (ticketIds.length === 0) {
    const tickets = await AppDataSource.getRepository(Ticket).find({
      where: { orderId: order.id },
      select: ["id"],
      order: { id: "ASC" },
    });
    ticketIds = tickets.map((ticket) => ticket.id);
  } else {
    const matching = await AppDataSource.getRepository(Ticket).count({
      where: { orderId: order.id, id: In(ticketIds) },
    });
    if (matching !== ticketIds.length) {
      logger.error(CONTEXT, "Ticket IDs do not belong to order — delivery skipped", {
        orderId: order.id,
        expected: ticketIds.length,
        matched: matching,
      });
      return;
    }
  }

  if (ticketIds.length === 0) {
    logger.error(CONTEXT, "No tickets for order — delivery skipped", {
      orderId: order.id,
    });
    return;
  }

  const jobId = `ticket-delivery:${order.id}`;

  try {
    const ticketQueue = getTicketDeliveryQueue();

    await ticketQueue.add(
      "deliver",
      {
        orderId: order.id,
        userId: order.userId,
        userEmail: order.user.email,
        userName: order.user.name,
        ticketIds,
      },
      { jobId },
    );

    logger.info(CONTEXT, "Ticket delivery job enqueued", {
      orderId: order.id,
      ticketCount: ticketIds.length,
      jobId,
    });
  } catch (error) {
    if (isDuplicateJobError(error)) {
      logger.info(CONTEXT, "Ticket delivery job already enqueued", {
        orderId: order.id,
        jobId,
      });
      return;
    }

    logger.error(CONTEXT, "Failed to enqueue ticket delivery job", {
      orderId: order.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
