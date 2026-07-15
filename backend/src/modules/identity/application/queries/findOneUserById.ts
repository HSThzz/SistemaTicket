/**
 * @file Query: busca usuário por ID.
 * @module modules/identity/application/queries/findOneUserById
 */

import { User } from "../../../../shared/infrastructure/persistence/entities/User";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneUserById(userId: string,
): Promise<User | null> {
  return AppDataSource.getRepository(User)
    .createQueryBuilder("user")
    .where("user.id = :userId", { userId })
    .getOne();
}


