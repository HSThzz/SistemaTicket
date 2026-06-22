/**
 * @file Fila BullMQ de notificações de participação em eventos privados.
 * @module modules/participation/infrastructure/queues/participationNotificationQueue
 */

import { Queue } from "bullmq";
import { DEFAULT_JOB_OPTIONS } from "../../../../shared/infrastructure/messaging/defaultJobOptions";
import { getBullMQConnection } from "../../../../shared/infrastructure/messaging/bullmqConnection";
import { PARTICIPATION_NOTIFICATION_QUEUE } from "../../../../shared/infrastructure/messaging/queueNames";
import type { ParticipationApprovedJobData } from "../../application/types/participationApprovedJob";
import type { ParticipationRejectedJobData } from "../../application/types/participationRejectedJob";
import type { ParticipationRequestSubmittedJobData } from "../../application/types/participationRequestSubmittedJob";

export type ParticipationNotificationJobData =
  | ParticipationApprovedJobData
  | ParticipationRejectedJobData
  | ParticipationRequestSubmittedJobData;

let queue: Queue<ParticipationNotificationJobData> | null = null;

/** Retorna singleton da fila `participation-notification`. */
export function getParticipationNotificationQueue(): Queue<ParticipationNotificationJobData> {
  if (!queue) {
    queue = new Queue<ParticipationNotificationJobData>(PARTICIPATION_NOTIFICATION_QUEUE, {
      connection: getBullMQConnection(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
  }

  return queue;
}

/** Encerra conexão da fila no graceful shutdown. */
export async function closeParticipationNotificationQueue(): Promise<void> {
  await queue?.close();
  queue = null;
}
