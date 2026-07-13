/**
 * @file Command: enfileira e-mail de nova solicitação de participação para o produtor.
 * @module modules/participation/application/commands/enqueueParticipationRequestSubmittedNotification
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { isDuplicateJobError } from "../../../../shared/infrastructure/messaging/isDuplicateJobError";
import { getParticipationNotificationQueue } from "../../infrastructure/queues/participationNotificationQueue";
import type { ParticipationRequestSubmittedJobData } from "../types/participationRequestSubmittedJob";

const CONTEXT = "EnqueueParticipationRequestSubmittedNotification";
const logger = Logger.getInstance();

/**
 * Adiciona job na fila `participation-notification` após enviar uma solicitação.
 */
export async function enqueueParticipationRequestSubmittedNotification(
  data: ParticipationRequestSubmittedJobData,
): Promise<void> {
  const jobId = `participation-submitted:${data.requestId}`;

  try {
    const queue = getParticipationNotificationQueue();

    await queue.add("participation-request-submitted", data, { jobId });

    logger.info(CONTEXT, "Participation request submitted notification job enqueued", {
      requestId: data.requestId,
      eventId: data.eventId,
      jobId,
    });
  } catch (error) {
    if (isDuplicateJobError(error)) {
      logger.info(CONTEXT, "Participation submitted notification already enqueued", {
        requestId: data.requestId,
        jobId,
      });
      return;
    }

    logger.error(CONTEXT, "Failed to enqueue participation request submitted notification", {
      requestId: data.requestId,
      eventId: data.eventId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
