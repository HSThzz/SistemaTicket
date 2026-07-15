/**
 * @file Command: enfileira e-mail de pedido reembolsado.
 * @module modules/notifications/application/commands/enqueueOrderRefundNotification
 */

import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { isDuplicateJobError } from "../../../../shared/infrastructure/messaging/isDuplicateJobError";
import { queueJobId } from "../../../../shared/infrastructure/messaging/queueJobId";
import { TicketStatus } from "../../../../shared/kernel/enums";
import { getOrderRefundNotificationQueue } from "../../infrastructure/queues/orderRefundNotificationQueue";

const CONTEXT = "EnqueueOrderRefundNotification";
const logger = Logger.getInstance();

/**
 * Adiciona job na fila `order-refund-notification` com `jobId` determinístico.
 */
export async function enqueueOrderRefundNotification(orderId: string): Promise<void> {
  const order = await AppDataSource.getRepository(Order).findOne({
    where: { id: orderId },
    relations: {
      user: true,
      reservation: {
        ticketLot: {
          event: true,
        },
      },
    },
  });

  if (!order?.user) {
    logger.error(CONTEXT, "Order or user not found — refund email skipped", {
      orderId,
    });
    return;
  }

  const cancelledTickets = await AppDataSource.getRepository(Ticket).count({
    where: { orderId: order.id, status: TicketStatus.CANCELLED },
  });

  const eventTitle =
    order.reservation?.ticketLot?.event?.title ?? "seu evento";

  const jobId = queueJobId("order-refund", order.id);

  try {
    const queue = getOrderRefundNotificationQueue();

    await queue.add(
      "notify",
      {
        orderId: order.id,
        userId: order.userId,
        userEmail: order.user.email,
        userName: order.user.name,
        eventTitle,
        totalPriceCents: order.totalPrice,
        ticketsCancelled: cancelledTickets,
      },
      { jobId },
    );

    logger.info(CONTEXT, "Order refund notification enqueued", {
      orderId: order.id,
      jobId,
    });
  } catch (error) {
    if (isDuplicateJobError(error)) {
      logger.info(CONTEXT, "Order refund notification already enqueued", {
        orderId: order.id,
        jobId,
      });
      return;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(CONTEXT, `Failed to enqueue refund notification: ${errorMessage}`, {
      orderId: order.id,
      jobId,
      err: error instanceof Error ? error : undefined,
    });
    throw error;
  }
}
