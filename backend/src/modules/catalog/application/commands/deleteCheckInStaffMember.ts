/**
 * @file Command: remove membro da equipe de portaria.
 * @module modules/catalog/application/commands/deleteCheckInStaffMember
 */

import { EventCheckInStaff } from "../../../../shared/infrastructure/persistence/entities/EventCheckInStaff";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function deleteCheckInStaffMember(
  eventId: string,
  userId: string,
): Promise<boolean> {
  const result = await AppDataSource.getRepository(EventCheckInStaff).delete({
    eventId,
    userId,
  });
  return (result.affected ?? 0) > 0;
}
