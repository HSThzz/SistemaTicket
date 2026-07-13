/**
 * @file Serviço: produtor aprova ou recusa uma solicitação de participação.
 * @module modules/participation/application/services/reviewParticipationRequest
 *
 * Aprovar libera o fluxo de checkout existente para o usuário (via gate em
 * {@link checkParticipationAccess}); a compra/pagamento seguem inalterados.
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { ParticipationRequestStatus } from "../../../../shared/kernel/enums";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { uuidSchema } from "../../../../shared/kernel/zodFields";
import { findOneEventById } from "../../../catalog/application/queries/findOneEventById";
import {
  ParticipationAlreadyReviewedError,
  ParticipationEventNotFoundError,
  ParticipationRequestNotFoundError,
} from "../../domain/errors/ParticipationError";
import {
  reviewParticipationRequestSchema,
  type ReviewParticipationRequestInputSchema,
} from "../../validators/schema/reviewParticipationRequestSchema";
import { enqueueParticipationApprovedNotification } from "../commands/enqueueParticipationApprovedNotification";
import { enqueueParticipationRejectedNotification } from "../commands/enqueueParticipationRejectedNotification";
import { reviewParticipationRequest as reviewParticipationRequestCommand } from "../commands/reviewParticipationRequest";
import { assertCanManageEventParticipation } from "../helpers/assertCanManageEventParticipation";
import { assertEventAllowsParticipationReview } from "../helpers/assertEventParticipationLifecycle";
import { mapReviewDecisionToStatus } from "../helpers/mapReviewDecisionToStatus";
import { findOneParticipationRequestById } from "../queries/findOneParticipationRequestById";
import type { ParticipationActor } from "../types";

const CONTEXT = "reviewParticipationRequest";

export async function reviewParticipationRequest(
  eventId: string,
  requestId: string,
  input: ReviewParticipationRequestInputSchema,
  actor: ParticipationActor,
) {
  const validEventId = validateSchema(uuidSchema, eventId);
  const validRequestId = validateSchema(uuidSchema, requestId);
  const data = validateSchema(reviewParticipationRequestSchema, input);

  const event = await findOneEventById(validEventId);
  if (!event) {
    throw new ParticipationEventNotFoundError(validEventId);
  }

  assertCanManageEventParticipation(event, actor);
  assertEventAllowsParticipationReview(event);

  const nextStatus = mapReviewDecisionToStatus(data.decision);

  const saved = await reviewParticipationRequestCommand(
    validRequestId,
    validEventId,
    nextStatus,
    actor.userId,
  );

  if (!saved) {
    const current = await findOneParticipationRequestById(validRequestId);
    if (!current || current.eventId !== validEventId) {
      throw new ParticipationRequestNotFoundError(validRequestId);
    }

    throw new ParticipationAlreadyReviewedError(current.status);
  }

  Logger.getInstance().info(CONTEXT, "Participation request reviewed", {
    requestId: saved.id,
    eventId: validEventId,
    status: saved.status,
    reviewedBy: actor.userId,
  });

  if (saved.status === ParticipationRequestStatus.APPROVED) {
    await enqueueParticipationApprovedNotification({
      requestId: saved.id,
      eventId: validEventId,
      eventTitle: event.title,
      participantName: saved.name,
      participantEmail: saved.email,
    });
  }

  if (saved.status === ParticipationRequestStatus.REJECTED) {
    await enqueueParticipationRejectedNotification({
      requestId: saved.id,
      eventId: validEventId,
      eventTitle: event.title,
      participantName: saved.name,
      participantEmail: saved.email,
    });
  }

  return saved;
}
