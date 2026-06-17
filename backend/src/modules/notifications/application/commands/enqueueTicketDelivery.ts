/**
 * @file Command: enfileira entrega assíncrona de ingressos após pagamento confirmado.
 * @module modules/notifications/application/commands/enqueueTicketDelivery
 */

import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import type { ProcessPaymentSucceededResult } from "../../../payment/application/commands/processPaymentSucceeded";
import { getTicketDeliveryQueue } from "../../infrastructure/queues/ticketDeliveryQueue";

const CONTEXT = "EnqueueTicketDelivery";
const logger = Logger.getInstance();

/**
 * Adiciona job na fila `ticket-delivery` sem bloquear a confirmação de pagamento.
 */
export async function enqueueTicketDelivery(
  result: Pick<ProcessPaymentSucceededResult, "id" | "ticketIds">,
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

  try {
    const ticketQueue = getTicketDeliveryQueue();

    await ticketQueue.add("deliver", {
      orderId: result.id,
      userId: order.userId,
      userEmail: order.user.email,
      userName: order.user.name,
      ticketIds: result.ticketIds,
    });

    logger.info(CONTEXT, "Ticket delivery job enqueued", {
      orderId: result.id,
      ticketCount: result.ticketIds.length,
    });
  } catch (error) {
    logger.error(CONTEXT, "Failed to enqueue ticket delivery job", {
      orderId: result.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
