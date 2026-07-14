/**
 * @file Indica se o ator pode fazer check-in em um evento.
 * @module modules/ticketing/application/helpers/canCheckInForEvent
 */

import type { EntityManager } from "typeorm";
import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { isStaffRole } from "../../../../shared/kernel/staffRoles";
import { isEventCheckInStaffMember } from "../queries/isEventCheckInStaffMember";
import type { CheckInActor } from "../services/types";

/**
 * Staff da plataforma, dono do evento ou membro da equipe de portaria.
 */
export async function canCheckInForEvent(
  actor: CheckInActor,
  event: Pick<Event, "id" | "producerId">,
  manager?: EntityManager,
): Promise<boolean> {
  if (isStaffRole(actor.role)) {
    return true;
  }

  if (event.producerId === actor.userId) {
    return true;
  }

  return isEventCheckInStaffMember(event.id, actor.userId, manager);
}
