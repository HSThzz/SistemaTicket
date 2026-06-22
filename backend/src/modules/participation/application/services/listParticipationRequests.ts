/**
 * @file Serviço: produtor lista solicitações de participação de um evento.
 * @module modules/participation/application/services/listParticipationRequests
 */

import { ParticipationRequestStatus } from "../../../../shared/kernel/enums";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { uuidSchema } from "../../../../shared/kernel/zodFields";
import { findOneEventById } from "../../../catalog/application/queries/findOneEventById";
import { ParticipationEventNotFoundError } from "../../domain/errors/ParticipationError";
import { assertCanManageEventParticipation } from "../helpers/assertCanManageEventParticipation";
import { findParticipationRequestsByEvent } from "../queries/findParticipationRequestsByEvent";
import type { ParticipationActor } from "../types";

export async function listParticipationRequests(
  eventId: string,
  status: ParticipationRequestStatus,
  actor: ParticipationActor,
) {
  const id = validateSchema(uuidSchema, eventId);

  const event = await findOneEventById(id);
  if (!event) {
    throw new ParticipationEventNotFoundError(id);
  }

  assertCanManageEventParticipation(event, actor);

  return findParticipationRequestsByEvent(id, status);
}
