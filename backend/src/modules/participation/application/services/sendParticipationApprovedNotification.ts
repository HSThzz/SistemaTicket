/**
 * @file Serviço de envio de e-mail quando a participação é aprovada.
 * @module modules/participation/application/services/sendParticipationApprovedNotification
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { redactEmail } from "../../../../shared/kernel/redactEmail";
import { sanitizeEmailHeader } from "../../../../shared/kernel/sanitizeEmailHeader";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import type { EmailProvider } from "../../../notifications/infrastructure/email/EmailProvider";
import { buildParticipationApprovedEmail } from "../../../notifications/infrastructure/email/emailTemplates";
import { StubEmailProvider } from "../../../notifications/infrastructure/email/StubEmailProvider";
import {
  claimEmailDelivery,
  releaseEmailDeliveryClaim,
} from "../../../notifications/application/helpers/emailDeliveryLedger";
import { participationApprovedJobSchema } from "../../validators/schema/participationNotificationJobSchemas";
import type { ParticipationApprovedJobData } from "../types/participationApprovedJob";

const CONTEXT = "SendParticipationApprovedNotification";
const logger = Logger.getInstance();

let emailProvider: EmailProvider = new StubEmailProvider();

/** Permite injetar provedor real de e-mail. */
export function setParticipationEmailProvider(provider: EmailProvider): void {
  emailProvider = provider;
}

/** Provedor compartilhado entre notificações do módulo de participação. */
export function getParticipationEmailProvider(): EmailProvider {
  return emailProvider;
}

/**
 * Envia e-mail transacional informando que a solicitação foi aprovada.
 */
export async function sendParticipationApprovedNotification(
  data: ParticipationApprovedJobData,
): Promise<void> {
  const parsed = validateSchema(participationApprovedJobSchema, data);
  const deliveryKey = `participation-approved:${parsed.requestId}`;

  if (!(await claimEmailDelivery(deliveryKey))) {
    logger.info(CONTEXT, "Participation approved email skipped — already sent", {
      requestId: parsed.requestId,
    });
    return;
  }

  try {
    logger.info(CONTEXT, "Processing participation approved notification", {
      requestId: parsed.requestId,
      eventId: parsed.eventId,
      email: redactEmail(parsed.participantEmail),
    });

    await getParticipationEmailProvider().send({
      to: parsed.participantEmail,
      subject: sanitizeEmailHeader(
        `Participação aprovada — ${parsed.eventTitle}`,
      ),
      html: buildParticipationApprovedEmail(parsed),
    });

    logger.info(CONTEXT, "Participation approved notification sent", {
      requestId: parsed.requestId,
      eventId: parsed.eventId,
    });
  } catch (error) {
    await releaseEmailDeliveryClaim(deliveryKey);
    throw error;
  }
}
