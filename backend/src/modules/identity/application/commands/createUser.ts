/**
 * @file Command: persiste novo usuário.
 * @module modules/identity/application/commands/createUser
 */

import { User } from "../../../../shared/infrastructure/persistence/entities/User";
import type { UserRole } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  document: string;
  role: UserRole;
}

export async function createUser(data: CreateUserData,
): Promise<User> {
  const repository = AppDataSource.getRepository(User);
  const user = repository.create(data);
  return repository.save(user);
}


