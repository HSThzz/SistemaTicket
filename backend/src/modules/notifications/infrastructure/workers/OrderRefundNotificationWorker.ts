/**
 * @file Worker BullMQ que envia e-mail de pedido reembolsado.
 * @module modules/notifications/infrastructure/workers/OrderRefundNotificationWorker
 */

import { Worker } from "bullmq";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { getBullMQConnection } from "../../../../shared/infrastructure/messaging/bullmqConnection";
import { ORDER_REFUND_NOTIFICATION_QUEUE } from "../../../../shared/infrastructure/messaging/queueNames";
import { sendOrderRefundNotification } from "../../application/services/sendOrderRefundNotification";
import type { OrderRefundJobData } from "../../application/types/orderRefundJob";

const CONTEXT = "OrderRefundNotificationWorker";

/**
 * Consome a fila `order-refund-notification` e envia o e-mail ao comprador.
 */
export class OrderRefundNotificationWorker {
  private readonly logger = Logger.getInstance();
  private worker: Worker<OrderRefundJobData> | null = null;
  private processedCount = 0;
  private failedCount = 0;

  /** Inicia o worker BullMQ. */
  async start(): Promise<void> {
    this.worker = new Worker<OrderRefundJobData>(
      ORDER_REFUND_NOTIFICATION_QUEUE,
      async (job) => {
        await sendOrderRefundNotification(job.data);
      },
      {
        connection: getBullMQConnection(),
      },
    );

    this.worker.on("completed", (job) => {
      this.processedCount += 1;
      this.logger.info(CONTEXT, "Job completed", {
        jobId: job.id,
        orderId: job.data.orderId,
      });
    });

    this.worker.on("failed", (job, error) => {
      this.failedCount += 1;
      this.logger.error(CONTEXT, "Job failed", {
        jobId: job?.id,
        orderId: job?.data.orderId,
        attemptsMade: job?.attemptsMade,
        error: error.message,
      });
    });

    this.logger.info(CONTEXT, "Worker started", {
      queue: ORDER_REFUND_NOTIFICATION_QUEUE,
    });
  }

  /** Encerra o worker de forma ordenada. */
  async stop(): Promise<void> {
    await this.worker?.close();
    this.worker = null;

    this.logger.info(CONTEXT, "Worker stopped", {
      processedCount: this.processedCount,
      failedCount: this.failedCount,
    });
  }

  getMetrics(): { processedCount: number; failedCount: number } {
    return {
      processedCount: this.processedCount,
      failedCount: this.failedCount,
    };
  }
}
