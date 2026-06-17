/**
 * @file Fila BullMQ de entrega de ingressos.
 * @module modules/notifications/infrastructure/queues/ticketDeliveryQueue
 */

import { Queue } from "bullmq";
import { DEFAULT_JOB_OPTIONS } from "../../../../shared/infrastructure/messaging/defaultJobOptions";
import { getBullMQConnection } from "../../../../shared/infrastructure/messaging/bullmqConnection";
import { TICKET_DELIVERY_QUEUE } from "../../../../shared/infrastructure/messaging/queueNames";
import type { TicketDeliveryJobData } from "../../application/types/ticketDeliveryJob";

let queue: Queue<TicketDeliveryJobData> | null = null;

/** Retorna singleton da fila `ticket-delivery`. */
export function getTicketDeliveryQueue(): Queue<TicketDeliveryJobData> {
  if (!queue) {
    queue = new Queue<TicketDeliveryJobData>(TICKET_DELIVERY_QUEUE, {
      connection: getBullMQConnection(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
  }

  return queue;
}

/** Encerra conexão da fila no graceful shutdown. */
export async function closeTicketDeliveryQueue(): Promise<void> {
  await queue?.close();
  queue = null;
}
