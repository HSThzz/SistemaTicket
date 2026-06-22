/**
 * @file Serviço de e-mail ao produtor quando há nova solicitação de participação.
 * @module modules/participation/application/services/sendParticipationRequestSubmittedNotification
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { buildParticipationRequestSubmittedEmail } from "../../../notifications/infrastructure/email/emailTemplates";
import type { ParticipationRequestSubmittedJobData } from "../types/participationRequestSubmittedJob";
import { getParticipationEmailProvider } from "./sendParticipationApprovedNotification";

const CONTEXT = "SendParticipationRequestSubmittedNotification";
const logger = Logger.getInstance();

/**
 * Notifica o produtor para revisar a solicitação no painel do evento.
 */
export async function sendParticipationRequestSubmittedNotification(
  data: ParticipationRequestSubmittedJobData,
): Promise<void> {
  logger.info(CONTEXT, "Processing participation request submitted notification", {
    requestId: data.requestId,
    eventId: data.eventId,
    email: data.producerEmail,
  });

  await getParticipationEmailProvider().send({
    to: data.producerEmail,
    subject: `Nova solicitação — ${data.eventTitle}`,
    html: buildParticipationRequestSubmittedEmail(data),
  });

  logger.info(CONTEXT, "Participation request submitted notification sent", {
    requestId: data.requestId,
    eventId: data.eventId,
  });
}
