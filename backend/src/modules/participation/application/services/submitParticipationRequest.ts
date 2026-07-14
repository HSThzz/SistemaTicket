/**
 * @file Serviço: usuário autenticado envia solicitação de participação em evento privado.
 * @module modules/participation/application/services/submitParticipationRequest
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { isUniqueViolation } from "../../../../shared/infrastructure/persistence/isUniqueViolation";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { findOneEventById } from "../../../catalog/application/queries/findOneEventById";
import { findOneUserById } from "../../../identity/application/queries/findOneUserById";
import {
  ParticipationAlreadyRequestedError,
  ParticipationError,
  ParticipationEventNotFoundError,
} from "../../domain/errors/ParticipationError";
import {
  submitParticipationRequestSchema,
  type SubmitParticipationRequestInputSchema,
} from "../../validators/schema/submitParticipationRequestSchema";
import { createParticipationRequest } from "../commands/createParticipationRequest";
import { enqueueParticipationRequestSubmittedNotification } from "../commands/enqueueParticipationRequestSubmittedNotification";
import { assertEventAcceptsParticipationRequests } from "../helpers/assertEventParticipationLifecycle";
import { assertNoBlockingParticipationRequest } from "../helpers/assertNoBlockingParticipationRequest";
import { normalizeParticipationEmail } from "../helpers/normalizeParticipationEmail";
import { findExistingParticipationRequest } from "../queries/findExistingParticipationRequest";
import { findExistingParticipationRequestByEmail } from "../queries/findExistingParticipationRequestByEmail";
import type { ParticipationRequester } from "../types";

const CONTEXT = "submitParticipationRequest";
const logger = Logger.getInstance();

export async function submitParticipationRequest(
  eventId: string,
  input: SubmitParticipationRequestInputSchema,
  requester: ParticipationRequester,
) {
  const data = validateSchema(submitParticipationRequestSchema, input);

  const user = await findOneUserById(requester.userId);
  if (!user) {
    throw new ParticipationError("Authenticated user not found", "USER_NOT_FOUND");
  }

  const event = await findOneEventById(eventId);
  if (!event) {
    throw new ParticipationEventNotFoundError(eventId);
  }

  assertEventAcceptsParticipationRequests(event);

  const email = normalizeParticipationEmail(user.email);

  const existingByUser = await findExistingParticipationRequest(
    eventId,
    requester.userId,
  );
  assertNoBlockingParticipationRequest(existingByUser);

  const existingByEmail = await findExistingParticipationRequestByEmail(
    eventId,
    email,
  );
  if (!existingByUser || existingByEmail?.id !== existingByUser.id) {
    assertNoBlockingParticipationRequest(existingByEmail);
  }

  let created;
  try {
    created = await createParticipationRequest({
      eventId,
      userId: requester.userId,
      name: user.name,
      email,
      phone: data.phone ?? null,
      instagramHandle: data.instagramHandle ?? null,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ParticipationAlreadyRequestedError();
    }
    throw error;
  }

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
        participantInstagramHandle: created.instagramHandle,
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
