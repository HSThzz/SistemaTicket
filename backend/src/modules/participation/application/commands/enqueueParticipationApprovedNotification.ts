/**
 * @file Command: enfileira e-mail de participação aprovada.
 * @module modules/participation/application/commands/enqueueParticipationApprovedNotification
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { isDuplicateJobError } from "../../../../shared/infrastructure/messaging/isDuplicateJobError";
import { getParticipationNotificationQueue } from "../../infrastructure/queues/participationNotificationQueue";
import type { ParticipationApprovedJobData } from "../types/participationApprovedJob";

const CONTEXT = "EnqueueParticipationApprovedNotification";
const logger = Logger.getInstance();

/**
 * Adiciona job na fila `participation-notification` após aprovar a solicitação.
 */
export async function enqueueParticipationApprovedNotification(
  data: ParticipationApprovedJobData,
): Promise<void> {
  const jobId = `participation-approved:${data.requestId}`;

  try {
    const queue = getParticipationNotificationQueue();

    await queue.add("participation-approved", data, { jobId });

    logger.info(CONTEXT, "Participation approved notification job enqueued", {
      requestId: data.requestId,
      eventId: data.eventId,
      jobId,
    });
  } catch (error) {
    if (isDuplicateJobError(error)) {
      logger.info(CONTEXT, "Participation approved notification already enqueued", {
        requestId: data.requestId,
        jobId,
      });
      return;
    }

    logger.error(CONTEXT, "Failed to enqueue participation approved notification", {
      requestId: data.requestId,
      eventId: data.eventId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
