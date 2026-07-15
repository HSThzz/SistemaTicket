/**
 * @file Query: lista equipe de portaria de um evento.
 * @module modules/catalog/application/queries/findCheckInStaffByEventId
 */

import { EventCheckInStaff } from "../../../../shared/infrastructure/persistence/entities/EventCheckInStaff";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findCheckInStaffByEventId(
  eventId: string,
): Promise<EventCheckInStaff[]> {
  return AppDataSource.getRepository(EventCheckInStaff)
    .createQueryBuilder("staff")
    .leftJoinAndSelect("staff.user", "user")
    .where("staff.eventId = :eventId", { eventId })
    .orderBy("staff.createdAt", "ASC")
    .getMany();
}
