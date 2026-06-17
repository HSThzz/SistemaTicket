/**
 * @file Worker BullMQ que processa entrega de ingressos (PDF + e-mail).
 * @module modules/notifications/infrastructure/workers/TicketDeliveryWorker
 */

import { Worker } from "bullmq";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { getBullMQConnection } from "../../../../shared/infrastructure/messaging/bullmqConnection";
import { TICKET_DELIVERY_QUEUE } from "../../../../shared/infrastructure/messaging/queueNames";
import { deliverTicketsEmail } from "../../application/services/deliverTicketsEmail";
import type { TicketDeliveryJobData } from "../../application/types/ticketDeliveryJob";

const CONTEXT = "TicketDeliveryWorker";

/**
 * Consome a fila `ticket-delivery` e executa geração de PDF + envio de e-mail.
 */
export class TicketDeliveryWorker {
  private readonly logger = Logger.getInstance();
  private worker: Worker<TicketDeliveryJobData> | null = null;
  private processedCount = 0;
  private failedCount = 0;

  /** Inicia o worker BullMQ. */
  async start(): Promise<void> {
    this.worker = new Worker<TicketDeliveryJobData>(
      TICKET_DELIVERY_QUEUE,
      async (job) => {
        await deliverTicketsEmail(job.data);
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
      queue: TICKET_DELIVERY_QUEUE,
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
