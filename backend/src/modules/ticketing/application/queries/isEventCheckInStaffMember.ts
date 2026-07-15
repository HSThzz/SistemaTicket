/**
 * @file Query: verifica se usuário é equipe de portaria do evento.
 * @module modules/ticketing/application/queries/isEventCheckInStaffMember
 */

import type { EntityManager } from "typeorm";
import { EventCheckInStaff } from "../../../../shared/infrastructure/persistence/entities/EventCheckInStaff";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function isEventCheckInStaffMember(
  eventId: string,
  userId: string,
  manager?: EntityManager,
): Promise<boolean> {
  const repo = manager
    ? manager.getRepository(EventCheckInStaff)
    : AppDataSource.getRepository(EventCheckInStaff);

  const count = await repo
    .createQueryBuilder("staff")
    .where("staff.eventId = :eventId", { eventId })
    .andWhere("staff.userId = :userId", { userId })
    .getCount();

  return count > 0;
}
