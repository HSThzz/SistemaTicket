/**
 * @file Query: busca usuário por e-mail.
 * @module modules/identity/application/queries/findOneUserByEmail
 */

import type { DataSource } from "typeorm";
import { User } from "../../../../shared/infrastructure/persistence/entities/User";

export async function findOneUserByEmail(
  dataSource: DataSource,
  email: string,
): Promise<User | null> {
  return dataSource.getRepository(User).findOne({
    where: { email: email.toLowerCase() },
  });
}
