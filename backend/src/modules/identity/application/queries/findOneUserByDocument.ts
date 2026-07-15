/**
 * @file Query: busca usuário por CPF (apenas dígitos).
 * @module modules/identity/application/queries/findOneUserByDocument
 */

import { User } from "../../../../shared/infrastructure/persistence/entities/User";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneUserByDocument(document: string): Promise<User | null> {
  return AppDataSource.getRepository(User)
    .createQueryBuilder("user")
    .where("user.document = :document", { document })
    .getOne();
}
