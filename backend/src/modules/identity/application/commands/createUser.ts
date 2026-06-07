/**
 * @file Command: persiste novo usuário.
 * @module modules/identity/application/commands/createUser
 */

import { User } from "../../../../shared/infrastructure/persistence/entities/User";
import type { Prettify } from "../../../../shared/kernel/prettify";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export type CreateUserData = Prettify<
  Pick<User, "name" | "email" | "passwordHash" | "document" | "role">
>;

export async function createUser(data: CreateUserData,
): Promise<User> {
  const repository = AppDataSource.getRepository(User);
  const user = repository.create(data);
  return repository.save(user);
}
