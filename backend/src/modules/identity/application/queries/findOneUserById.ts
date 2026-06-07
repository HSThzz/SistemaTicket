/**
 * @file Query: busca usuário por ID.
 * @module modules/identity/application/queries/findOneUserById
 */

import type { DataSource } from "typeorm";
import { User } from "../../../../shared/infrastructure/persistence/entities/User";

export async function findOneUserById(
  dataSource: DataSource,
  userId: string,
): Promise<User | null> {
  return dataSource.getRepository(User).findOne({
    where: { id: userId },
  });
}
