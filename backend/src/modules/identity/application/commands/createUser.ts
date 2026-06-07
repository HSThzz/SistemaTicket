/**
 * @file Command: persiste novo usuário.
 * @module modules/identity/application/commands/createUser
 */

import type { DataSource } from "typeorm";
import { User } from "../../../../shared/infrastructure/persistence/entities/User";
import type { UserRole } from "../../../../shared/kernel/enums";

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  document: string;
  role: UserRole;
}

export async function createUser(
  dataSource: DataSource,
  data: CreateUserData,
): Promise<User> {
  const repository = dataSource.getRepository(User);
  const user = repository.create(data);
  return repository.save(user);
}
