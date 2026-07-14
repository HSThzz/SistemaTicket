/**
 * @file Query: lista equipe de portaria de um evento.
 * @module modules/catalog/application/queries/findCheckInStaffByEventId
 */

import { EventCheckInStaff } from "../../../../shared/infrastructure/persistence/entities/EventCheckInStaff";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findCheckInStaffByEventId(
  eventId: string,
): Promise<EventCheckInStaff[]> {
  return AppDataSource.getRepository(EventCheckInStaff).find({
    where: { eventId },
    relations: { user: true },
    order: { createdAt: "ASC" },
  });
}
