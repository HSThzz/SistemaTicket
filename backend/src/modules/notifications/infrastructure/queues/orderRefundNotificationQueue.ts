/**
 * @file Fila BullMQ de notificação de reembolso de pedido.
 * @module modules/notifications/infrastructure/queues/orderRefundNotificationQueue
 */

import { Queue } from "bullmq";
import { DEFAULT_JOB_OPTIONS } from "../../../../shared/infrastructure/messaging/defaultJobOptions";
import { getBullMQConnection } from "../../../../shared/infrastructure/messaging/bullmqConnection";
import { ORDER_REFUND_NOTIFICATION_QUEUE } from "../../../../shared/infrastructure/messaging/queueNames";
import type { OrderRefundJobData } from "../../application/types/orderRefundJob";

let queue: Queue<OrderRefundJobData> | null = null;

/** Retorna singleton da fila `order-refund-notification`. */
export function getOrderRefundNotificationQueue(): Queue<OrderRefundJobData> {
  if (!queue) {
    queue = new Queue<OrderRefundJobData>(ORDER_REFUND_NOTIFICATION_QUEUE, {
      connection: getBullMQConnection(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
  }

  return queue;
}

/** Encerra conexão da fila no graceful shutdown. */
export async function closeOrderRefundNotificationQueue(): Promise<void> {
  await queue?.close();
  queue = null;
}
