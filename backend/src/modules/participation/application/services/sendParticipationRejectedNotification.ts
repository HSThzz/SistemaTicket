/**
 * @file Serviço de envio de e-mail quando a participação é recusada.
 * @module modules/participation/application/services/sendParticipationRejectedNotification
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { redactEmail } from "../../../../shared/kernel/redactEmail";
import { sanitizeEmailHeader } from "../../../../shared/kernel/sanitizeEmailHeader";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { buildParticipationRejectedEmail } from "../../../notifications/infrastructure/email/emailTemplates";
import {
  claimEmailDelivery,
  releaseEmailDeliveryClaim,
} from "../../../notifications/application/helpers/emailDeliveryLedger";
import { participationRejectedJobSchema } from "../../validators/schema/participationNotificationJobSchemas";
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
  const parsed = validateSchema(participationRejectedJobSchema, data);
  const deliveryKey = `participation-rejected:${parsed.requestId}`;

  if (!(await claimEmailDelivery(deliveryKey))) {
    logger.info(CONTEXT, "Participation rejected email skipped — already sent", {
      requestId: parsed.requestId,
    });
    return;
  }

  try {
    logger.info(CONTEXT, "Processing participation rejected notification", {
      requestId: parsed.requestId,
      eventId: parsed.eventId,
      email: redactEmail(parsed.participantEmail),
    });

    await getParticipationEmailProvider().send({
      to: parsed.participantEmail,
      subject: sanitizeEmailHeader(
        `Participação não aprovada — ${parsed.eventTitle}`,
      ),
      html: buildParticipationRejectedEmail(parsed),
    });

    logger.info(CONTEXT, "Participation rejected notification sent", {
      requestId: parsed.requestId,
      eventId: parsed.eventId,
    });
  } catch (error) {
    await releaseEmailDeliveryClaim(deliveryKey);
    throw error;
  }
}
