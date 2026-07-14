/**
 * @file Query: vínculo de portaria por evento e usuário.
 * @module modules/catalog/application/queries/findCheckInStaffMember
 */

import { EventCheckInStaff } from "../../../../shared/infrastructure/persistence/entities/EventCheckInStaff";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findCheckInStaffMember(
  eventId: string,
  userId: string,
): Promise<EventCheckInStaff | null> {
  return AppDataSource.getRepository(EventCheckInStaff).findOne({
    where: { eventId, userId },
  });
}
