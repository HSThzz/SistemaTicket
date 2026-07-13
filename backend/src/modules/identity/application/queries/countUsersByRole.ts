/**
 * @file Query: conta usuários por papel.
 * @module modules/identity/application/queries/countUsersByRole
 */

import { User } from "../../../../shared/infrastructure/persistence/entities/User";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import type { UserRole } from "../../../../shared/kernel/enums";

export async function countUsersByRole(role: UserRole): Promise<number> {
  return AppDataSource.getRepository(User).count({ where: { role } });
}
