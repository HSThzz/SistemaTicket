/**
 * @file Command: persiste alterações em usuário existente.
 * @module modules/identity/application/commands/updateUser
 */

import { User } from "../../../../shared/infrastructure/persistence/entities/User";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function updateUser(user: User,
): Promise<User> {
  return AppDataSource.getRepository(User).save(user);
}


