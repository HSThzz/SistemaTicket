/**
 * @file Command: persiste alterações em usuário existente.
 * @module modules/identity/application/commands/updateUser
 */

import type { DataSource } from "typeorm";
import { User } from "../../../../shared/infrastructure/persistence/entities/User";

export async function updateUser(
  dataSource: DataSource,
  user: User,
): Promise<User> {
  return dataSource.getRepository(User).save(user);
}
