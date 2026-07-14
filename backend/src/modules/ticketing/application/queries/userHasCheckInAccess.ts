/**
 * @file Indica se o usuário tem alguma autorização de check-in (dono ou equipe).
 * @module modules/ticketing/application/queries/userHasCheckInAccess
 */

import { EventCheckInStaff } from "../../../../shared/infrastructure/persistence/entities/EventCheckInStaff";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { UserRole } from "../../../../shared/kernel/enums";
import { isStaffRole } from "../../../../shared/kernel/staffRoles";
import type { CheckInActor } from "../services/types";

export async function userHasCheckInAccess(actor: CheckInActor): Promise<boolean> {
  if (isStaffRole(actor.role) || actor.role === UserRole.PRODUCER) {
    return true;
  }

  const staffCount = await AppDataSource.getRepository(EventCheckInStaff).count({
    where: { userId: actor.userId },
  });

  return staffCount > 0;
}
