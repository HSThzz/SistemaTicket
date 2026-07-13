/**
 * @file Worker BullMQ que processa notificações de participação.
 * @module modules/participation/infrastructure/workers/ParticipationNotificationWorker
 */

import { Worker } from "bullmq";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { getBullMQConnection } from "../../../../shared/infrastructure/messaging/bullmqConnection";
import { PARTICIPATION_NOTIFICATION_QUEUE } from "../../../../shared/infrastructure/messaging/queueNames";
import type { ParticipationApprovedJobData } from "../../application/types/participationApprovedJob";
import type { ParticipationRejectedJobData } from "../../application/types/participationRejectedJob";
import type { ParticipationRequestSubmittedJobData } from "../../application/types/participationRequestSubmittedJob";
import { sendParticipationApprovedNotification } from "../../application/services/sendParticipationApprovedNotification";
import { sendParticipationRejectedNotification } from "../../application/services/sendParticipationRejectedNotification";
import { sendParticipationRequestSubmittedNotification } from "../../application/services/sendParticipationRequestSubmittedNotification";
import type { ParticipationNotificationJobData } from "../queues/participationNotificationQueue";

const CONTEXT = "ParticipationNotificationWorker";

/**
 * Consome a fila `participation-notification` e envia e-mails de forma assíncrona.
 */
export class ParticipationNotificationWorker {
  private readonly logger = Logger.getInstance();
  private worker: Worker<ParticipationNotificationJobData> | null = null;
  private processedCount = 0;
  private failedCount = 0;

  /** Inicia o worker BullMQ. */
  async start(): Promise<void> {
    this.worker = new Worker<ParticipationNotificationJobData>(
      PARTICIPATION_NOTIFICATION_QUEUE,
      async (job) => {
        if (job.name === "participation-request-submitted") {
          await sendParticipationRequestSubmittedNotification(
            job.data as ParticipationRequestSubmittedJobData,
          );
          return;
        }

        if (job.name === "participation-approved") {
          await sendParticipationApprovedNotification(
            job.data as ParticipationApprovedJobData,
          );
          return;
        }

        if (job.name === "participation-rejected") {
          await sendParticipationRejectedNotification(
            job.data as ParticipationRejectedJobData,
          );
          return;
        }

        this.logger.warn(CONTEXT, "Unknown participation notification job", {
          jobId: job.id,
          jobName: job.name,
        });
        throw new Error(`Unknown participation notification job: ${job.name}`);
      },
      {
        connection: getBullMQConnection(),
      },
    );

    this.worker.on("completed", (job) => {
      this.processedCount += 1;
      this.logger.info(CONTEXT, "Job completed", {
        jobId: job.id,
        jobName: job.name,
        requestId: job.data.requestId,
      });
    });

    this.worker.on("failed", (job, error) => {
      this.failedCount += 1;
      this.logger.error(CONTEXT, "Job failed", {
        jobId: job?.id,
        jobName: job?.name,
        requestId: job?.data.requestId,
        attemptsMade: job?.attemptsMade,
        error: error.message,
      });
    });

    this.logger.info(CONTEXT, "Worker started", {
      queue: PARTICIPATION_NOTIFICATION_QUEUE,
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
