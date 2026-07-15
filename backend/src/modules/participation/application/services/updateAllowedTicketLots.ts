/**
 * @file Serviço: atualiza lotes liberados de uma participação já aprovada.
 * @module modules/participation/application/services/updateAllowedTicketLots
 */

import { Logger } from "../../../../shared/infrastructure/config/logger";
import { ParticipationRequestStatus } from "../../../../shared/kernel/enums";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { uuidSchema } from "../../../../shared/kernel/zodFields";
import { findOneEventById } from "../../../catalog/application/queries/findOneEventById";
import { findTicketLotIdsByEventId } from "../../../catalog/application/queries/findTicketLotIdsByEventId";
import {
  ParticipationEventNotFoundError,
  ParticipationInvalidTicketLotsError,
  ParticipationLotsUpdateNotAllowedError,
  ParticipationNoTicketLotsError,
  ParticipationRequestNotFoundError,
} from "../../domain/errors/ParticipationError";
import {
  updateAllowedTicketLotsSchema,
  type UpdateAllowedTicketLotsInputSchema,
} from "../../validators/schema/updateAllowedTicketLotsSchema";
import { updateAllowedTicketLots as updateAllowedTicketLotsCommand } from "../commands/updateAllowedTicketLots";
import { assertCanManageEventParticipation } from "../helpers/assertCanManageEventParticipation";
import { assertEventAllowsParticipationReview } from "../helpers/assertEventParticipationLifecycle";
import { findOneParticipationRequestById } from "../queries/findOneParticipationRequestById";
import type { ParticipationActor } from "../types";

const CONTEXT = "updateAllowedTicketLots";

export async function updateAllowedTicketLots(
  eventId: string,
  requestId: string,
  input: UpdateAllowedTicketLotsInputSchema,
  actor: ParticipationActor,
) {
  const validEventId = validateSchema(uuidSchema, eventId);
  const validRequestId = validateSchema(uuidSchema, requestId);
  const data = validateSchema(updateAllowedTicketLotsSchema, input);

  const event = await findOneEventById(validEventId);
  if (!event) {
    throw new ParticipationEventNotFoundError(validEventId);
  }

  assertCanManageEventParticipation(event, actor);
  assertEventAllowsParticipationReview(event);

  const current = await findOneParticipationRequestById(validRequestId);
  if (!current || current.eventId !== validEventId) {
    throw new ParticipationRequestNotFoundError(validRequestId);
  }

  if (current.status !== ParticipationRequestStatus.APPROVED) {
    throw new ParticipationLotsUpdateNotAllowedError(current.status);
  }

  const eventLotIds = await findTicketLotIdsByEventId(validEventId);
  if (eventLotIds.length === 0) {
    throw new ParticipationNoTicketLotsError();
  }

  const uniqueRequested = [...new Set(data.ticketLotIds)];
  const eventLotIdSet = new Set(eventLotIds);
  if (
    uniqueRequested.length === 0 ||
    uniqueRequested.some((id) => !eventLotIdSet.has(id))
  ) {
    throw new ParticipationInvalidTicketLotsError();
  }

  const saved = await updateAllowedTicketLotsCommand(
    validRequestId,
    validEventId,
    uniqueRequested,
  );

  if (!saved) {
    throw new ParticipationRequestNotFoundError(validRequestId);
  }

  Logger.getInstance().info(CONTEXT, "Allowed ticket lots updated", {
    requestId: saved.id,
    eventId: validEventId,
    allowedTicketLotIds: saved.allowedTicketLotIds,
    updatedBy: actor.userId,
  });

  return saved;
}
