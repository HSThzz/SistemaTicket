/**
 * @file Serviço: remove membro da equipe de portaria.
 * @module modules/catalog/application/services/removeCheckInStaff
 */

import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { uuidSchema } from "../../../../shared/kernel/zodFields";
import {
  CheckInStaffNotFoundError,
  EventNotFoundError,
} from "../../domain/errors/EventError";
import { eventIdSchema } from "../../validators/schema/eventIdSchema";
import { deleteCheckInStaffMember } from "../commands/deleteCheckInStaffMember";
import { assertCanManageEvent } from "../helpers/assertCanManageEvent";
import { findOneEventById } from "../queries/findOneEventById";
import type { EventActor } from "../types";

export async function removeCheckInStaff(
  eventId: string,
  userId: string,
  actor: EventActor,
): Promise<void> {
  const id = validateSchema(eventIdSchema, eventId);
  const staffUserId = validateSchema(uuidSchema, userId);

  const event = await findOneEventById(id);
  if (!event) {
    throw new EventNotFoundError(id);
  }

  assertCanManageEvent(event, actor);

  const removed = await deleteCheckInStaffMember(id, staffUserId);
  if (!removed) {
    throw new CheckInStaffNotFoundError();
  }
}
