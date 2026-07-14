/**
 * @file Command: cria vínculo de equipe de portaria.
 * @module modules/catalog/application/commands/createCheckInStaffMember
 */

import { EventCheckInStaff } from "../../../../shared/infrastructure/persistence/entities/EventCheckInStaff";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function createCheckInStaffMember(params: {
  eventId: string;
  userId: string;
  addedByUserId: string;
}): Promise<EventCheckInStaff> {
  const repo = AppDataSource.getRepository(EventCheckInStaff);
  const row = repo.create({
    eventId: params.eventId,
    userId: params.userId,
    addedByUserId: params.addedByUserId,
  });
  return repo.save(row);
}
