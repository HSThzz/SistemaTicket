/**
 * @file Command: persiste alterações em usuário existente.
 * @module modules/identity/application/commands/updateUser
 */

import { User } from "../../../../shared/infrastructure/persistence/entities/User";
import type { Prettify } from "../../../../shared/kernel/prettify";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export type UpdateUserData = Prettify<
  Partial<Pick<User, "name" | "email" | "passwordHash" | "document" | "role">>
>;

export async function updateUser(
  user: User,
  changes?: UpdateUserData,
): Promise<User> {
  if (changes) {
    Object.assign(user, changes);
  }

  return AppDataSource.getRepository(User).save(user);
}
