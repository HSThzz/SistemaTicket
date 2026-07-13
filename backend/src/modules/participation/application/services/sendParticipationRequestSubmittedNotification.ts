/**
 * @file Serviço de e-mail ao produtor quando há nova solicitação de participação.
 * @module modules/participation/application/services/sendParticipationRequestSubmittedNotification
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { redactEmail } from "../../../../shared/kernel/redactEmail";
import { sanitizeEmailHeader } from "../../../../shared/kernel/sanitizeEmailHeader";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { buildParticipationRequestSubmittedEmail } from "../../../notifications/infrastructure/email/emailTemplates";
import {
  claimEmailDelivery,
  releaseEmailDeliveryClaim,
} from "../../../notifications/application/helpers/emailDeliveryLedger";
import { participationRequestSubmittedJobSchema } from "../../validators/schema/participationNotificationJobSchemas";
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
  const parsed = validateSchema(participationRequestSubmittedJobSchema, data);
  const deliveryKey = `participation-submitted:${parsed.requestId}`;

  if (!(await claimEmailDelivery(deliveryKey))) {
    logger.info(CONTEXT, "Participation submitted email skipped — already sent", {
      requestId: parsed.requestId,
    });
    return;
  }

  try {
    logger.info(CONTEXT, "Processing participation request submitted notification", {
      requestId: parsed.requestId,
      eventId: parsed.eventId,
      email: redactEmail(parsed.producerEmail),
    });

    await getParticipationEmailProvider().send({
      to: parsed.producerEmail,
      subject: sanitizeEmailHeader(`Nova solicitação — ${parsed.eventTitle}`),
      html: buildParticipationRequestSubmittedEmail(parsed),
    });

    logger.info(CONTEXT, "Participation request submitted notification sent", {
      requestId: parsed.requestId,
      eventId: parsed.eventId,
    });
  } catch (error) {
    await releaseEmailDeliveryClaim(deliveryKey);
    throw error;
  }
}
