/**
 * @file Encerramento centralizado de filas BullMQ no shutdown.
 * @module shared/infrastructure/messaging/closeBullMQQueues
 */

import { closeContactFormQueue } from "../../../modules/leads/infrastructure/queues/contactFormQueue";
import { closeParticipationNotificationQueue } from "../../../modules/participation/infrastructure/queues/participationNotificationQueue";
import { closeOrderRefundNotificationQueue } from "../../../modules/notifications/infrastructure/queues/orderRefundNotificationQueue";
import { closeTicketDeliveryQueue } from "../../../modules/notifications/infrastructure/queues/ticketDeliveryQueue";

/** Fecha todas as instâncias de Queue BullMQ abertas. */
export async function closeBullMQQueues(): Promise<void> {
  await Promise.all([
    closeTicketDeliveryQueue(),
    closeContactFormQueue(),
    closeParticipationNotificationQueue(),
    closeOrderRefundNotificationQueue(),
  ]);
}
