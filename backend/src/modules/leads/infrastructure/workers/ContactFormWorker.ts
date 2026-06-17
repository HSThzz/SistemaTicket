/**
 * @file Worker BullMQ que processa notificações do formulário de contato.
 * @module modules/leads/infrastructure/workers/ContactFormWorker
 */

import { Worker } from "bullmq";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { getBullMQConnection } from "../../../../shared/infrastructure/messaging/bullmqConnection";
import { CONTACT_FORM_QUEUE } from "../../../../shared/infrastructure/messaging/queueNames";
import { sendContactFormNotification } from "../../application/services/sendContactFormNotification";
import type { ContactFormJobData } from "../../application/types/contactFormJob";

const CONTEXT = "ContactFormWorker";

/**
 * Consome a fila `contact-form` e dispara e-mails/integrações de forma assíncrona.
 */
export class ContactFormWorker {
  private readonly logger = Logger.getInstance();
  private worker: Worker<ContactFormJobData> | null = null;
  private processedCount = 0;
  private failedCount = 0;

  /** Inicia o worker BullMQ. */
  async start(): Promise<void> {
    this.worker = new Worker<ContactFormJobData>(
      CONTACT_FORM_QUEUE,
      async (job) => {
        await sendContactFormNotification(job.data);
      },
      {
        connection: getBullMQConnection(),
      },
    );

    this.worker.on("completed", (job) => {
      this.processedCount += 1;
      this.logger.info(CONTEXT, "Job completed", {
        jobId: job.id,
        leadId: job.data.leadId,
      });
    });

    this.worker.on("failed", (job, error) => {
      this.failedCount += 1;
      this.logger.error(CONTEXT, "Job failed", {
        jobId: job?.id,
        leadId: job?.data.leadId,
        attemptsMade: job?.attemptsMade,
        error: error.message,
      });
    });

    this.logger.info(CONTEXT, "Worker started", {
      queue: CONTACT_FORM_QUEUE,
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
