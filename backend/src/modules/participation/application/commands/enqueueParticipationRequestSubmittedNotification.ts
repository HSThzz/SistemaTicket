/**
 * @file Command: enfileira e-mail de nova solicitação de participação para o produtor.
 * @module modules/participation/application/commands/enqueueParticipationRequestSubmittedNotification
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
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
  try {
    const queue = getParticipationNotificationQueue();

    await queue.add("participation-request-submitted", data);

    logger.info(CONTEXT, "Participation request submitted notification job enqueued", {
      requestId: data.requestId,
      eventId: data.eventId,
      producerEmail: data.producerEmail,
    });
  } catch (error) {
    logger.error(CONTEXT, "Failed to enqueue participation request submitted notification", {
      requestId: data.requestId,
      eventId: data.eventId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
