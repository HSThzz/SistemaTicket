/**
 * @file Serviço: produtor lista participantes que já pagaram em evento privado.
 * @module modules/participation/application/services/listPaidParticipants
 */

import { EventType } from "../../../../shared/kernel/enums";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { uuidSchema } from "../../../../shared/kernel/zodFields";
import { findOneEventById } from "../../../catalog/application/queries/findOneEventById";
import {
  ParticipationEventNotFoundError,
  ParticipationNotPrivateEventError,
} from "../../domain/errors/ParticipationError";
import { assertCanManageEventParticipation } from "../helpers/assertCanManageEventParticipation";
import { findPaidParticipantsByEventId } from "../queries/findPaidParticipantsByEventId";
import type { ParticipationActor } from "../types";

export async function listPaidParticipants(
  eventId: string,
  actor: ParticipationActor,
) {
  const id = validateSchema(uuidSchema, eventId);

  const event = await findOneEventById(id);
  if (!event || event.deletedAt) {
    throw new ParticipationEventNotFoundError(id);
  }

  if (event.type !== EventType.PRIVATE) {
    throw new ParticipationNotPrivateEventError();
  }

  assertCanManageEventParticipation(event, actor);

  return findPaidParticipantsByEventId(id);
}
