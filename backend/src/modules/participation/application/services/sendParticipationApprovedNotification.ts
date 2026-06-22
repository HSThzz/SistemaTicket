/**
 * @file Serviço de envio de e-mail quando a participação é aprovada.
 * @module modules/participation/application/services/sendParticipationApprovedNotification
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import type { EmailProvider } from "../../../notifications/infrastructure/email/EmailProvider";
import { buildParticipationApprovedEmail } from "../../../notifications/infrastructure/email/emailTemplates";
import { StubEmailProvider } from "../../../notifications/infrastructure/email/StubEmailProvider";
import type { ParticipationApprovedJobData } from "../types/participationApprovedJob";

const CONTEXT = "SendParticipationApprovedNotification";
const logger = Logger.getInstance();

let emailProvider: EmailProvider = new StubEmailProvider();

/** Permite injetar provedor real de e-mail. */
export function setParticipationEmailProvider(provider: EmailProvider): void {
  emailProvider = provider;
}

/**
 * Envia e-mail transacional informando que a solicitação foi aprovada.
 */
export async function sendParticipationApprovedNotification(
  data: ParticipationApprovedJobData,
): Promise<void> {
  logger.info(CONTEXT, "Processing participation approved notification", {
    requestId: data.requestId,
    eventId: data.eventId,
    email: data.participantEmail,
  });

  await emailProvider.send({
    to: data.participantEmail,
    subject: `Participação aprovada — ${data.eventTitle}`,
    html: buildParticipationApprovedEmail(data),
  });

  logger.info(CONTEXT, "Participation approved notification sent", {
    requestId: data.requestId,
    eventId: data.eventId,
  });
}
