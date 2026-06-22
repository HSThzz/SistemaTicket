/**
 * @file Serviço: usuário envia solicitação de participação em evento privado.
 * @module modules/participation/application/services/submitParticipationRequest
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { EventType } from "../../../../shared/kernel/enums";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { findOneEventById } from "../../../catalog/application/queries/findOneEventById";
import { findOneUserById } from "../../../identity/application/queries/findOneUserById";
import {
  ParticipationAlreadyRequestedError,
  ParticipationEventNotFoundError,
  ParticipationNotPrivateEventError,
} from "../../domain/errors/ParticipationError";
import {
  submitParticipationRequestSchema,
  type SubmitParticipationRequestInputSchema,
} from "../../validators/schema/submitParticipationRequestSchema";
import { createParticipationRequest } from "../commands/createParticipationRequest";
import { enqueueParticipationRequestSubmittedNotification } from "../commands/enqueueParticipationRequestSubmittedNotification";
import { findExistingParticipationRequest } from "../queries/findExistingParticipationRequest";
import type { ParticipationRequester } from "../types";

const CONTEXT = "submitParticipationRequest";
const logger = Logger.getInstance();

export async function submitParticipationRequest(
  eventId: string,
  input: SubmitParticipationRequestInputSchema,
  requester: ParticipationRequester,
) {
  const data = validateSchema(submitParticipationRequestSchema, input);

  const event = await findOneEventById(eventId);
  if (!event) {
    throw new ParticipationEventNotFoundError(eventId);
  }

  if (event.type !== EventType.PRIVATE) {
    throw new ParticipationNotPrivateEventError();
  }

  if (requester.userId) {
    const existing = await findExistingParticipationRequest(
      eventId,
      requester.userId,
    );
    if (existing) {
      throw new ParticipationAlreadyRequestedError();
    }
  }

  const created = await createParticipationRequest({
    eventId,
    userId: requester.userId,
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
  });

  logger.info(CONTEXT, "Participation request submitted", {
    requestId: created.id,
    eventId,
    userId: requester.userId,
  });

  if (event.producerId) {
    const producer = await findOneUserById(event.producerId);
    if (producer?.email) {
      await enqueueParticipationRequestSubmittedNotification({
        requestId: created.id,
        eventId,
        eventTitle: event.title,
        producerEmail: producer.email,
        producerName: producer.name,
        participantName: created.name,
        participantEmail: created.email,
        participantPhone: created.phone,
      });
    } else {
      logger.warn(CONTEXT, "Producer email unavailable for participation notification", {
        eventId,
        producerId: event.producerId,
      });
    }
  }

  return created;
}
