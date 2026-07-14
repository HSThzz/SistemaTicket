/**
 * @file Serviço: lista equipe de portaria do evento.
 * @module modules/catalog/application/services/listCheckInStaff
 */

import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { eventIdSchema } from "../../validators/schema/eventIdSchema";
import { EventNotFoundError } from "../../domain/errors/EventError";
import { assertCanManageEvent } from "../helpers/assertCanManageEvent";
import { findOneEventById } from "../queries/findOneEventById";
import { findCheckInStaffByEventId } from "../queries/findCheckInStaffByEventId";
import type { EventActor } from "../types";

export interface CheckInStaffListItem {
  userId: string;
  name: string;
  email: string;
  createdAt: string;
}

export async function listCheckInStaff(
  eventId: string,
  actor: EventActor,
): Promise<CheckInStaffListItem[]> {
  const id = validateSchema(eventIdSchema, eventId);
  const event = await findOneEventById(id);
  if (!event) {
    throw new EventNotFoundError(id);
  }

  assertCanManageEvent(event, actor);

  const rows = await findCheckInStaffByEventId(id);
  return rows.map((row) => ({
    userId: row.userId,
    name: row.user.name,
    email: row.user.email,
    createdAt: row.createdAt.toISOString(),
  }));
}
