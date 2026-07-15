/**
 * @file Query: busca usuário por e-mail.
 * @module modules/identity/application/queries/findOneUserByEmail
 */

import { User } from "../../../../shared/infrastructure/persistence/entities/User";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneUserByEmail(email: string,
): Promise<User | null> {
  return AppDataSource.getRepository(User)
    .createQueryBuilder("user")
    .where("user.email = :email", { email: email.toLowerCase() })
    .getOne();
}


