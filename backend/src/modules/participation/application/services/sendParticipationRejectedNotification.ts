/**
 * @file Serviço de envio de e-mail quando a participação é recusada.
 * @module modules/participation/application/services/sendParticipationRejectedNotification
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { buildParticipationRejectedEmail } from "../../../notifications/infrastructure/email/emailTemplates";
import type { ParticipationRejectedJobData } from "../types/participationRejectedJob";
import { getParticipationEmailProvider } from "./sendParticipationApprovedNotification";

const CONTEXT = "SendParticipationRejectedNotification";
const logger = Logger.getInstance();

/**
 * Envia e-mail transacional informando que a solicitação foi recusada.
 */
export async function sendParticipationRejectedNotification(
  data: ParticipationRejectedJobData,
): Promise<void> {
  logger.info(CONTEXT, "Processing participation rejected notification", {
    requestId: data.requestId,
    eventId: data.eventId,
    email: data.participantEmail,
  });

  await getParticipationEmailProvider().send({
    to: data.participantEmail,
    subject: `Participação não aprovada — ${data.eventTitle}`,
    html: buildParticipationRejectedEmail(data),
  });

  logger.info(CONTEXT, "Participation rejected notification sent", {
    requestId: data.requestId,
    eventId: data.eventId,
  });
}
