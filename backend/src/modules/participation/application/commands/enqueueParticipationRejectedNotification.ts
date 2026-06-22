/**
 * @file Command: enfileira e-mail de participação recusada.
 * @module modules/participation/application/commands/enqueueParticipationRejectedNotification
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { getParticipationNotificationQueue } from "../../infrastructure/queues/participationNotificationQueue";
import type { ParticipationRejectedJobData } from "../types/participationRejectedJob";

const CONTEXT = "EnqueueParticipationRejectedNotification";
const logger = Logger.getInstance();

/**
 * Adiciona job na fila `participation-notification` após recusar a solicitação.
 */
export async function enqueueParticipationRejectedNotification(
  data: ParticipationRejectedJobData,
): Promise<void> {
  try {
    const queue = getParticipationNotificationQueue();

    await queue.add("participation-rejected", data);

    logger.info(CONTEXT, "Participation rejected notification job enqueued", {
      requestId: data.requestId,
      eventId: data.eventId,
    });
  } catch (error) {
    logger.error(CONTEXT, "Failed to enqueue participation rejected notification", {
      requestId: data.requestId,
      eventId: data.eventId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
