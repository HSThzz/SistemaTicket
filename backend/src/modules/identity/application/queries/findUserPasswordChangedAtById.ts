/**
 * @file Query: busca marcador de troca de senha por ID de usuário.
 * @module modules/identity/application/queries/findUserPasswordChangedAtById
 */

import { User } from "../../../../shared/infrastructure/persistence/entities/User";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

/**
 * @returns `undefined` se o usuário não existir; caso contrário, data ou `null`.
 */
export async function findUserPasswordChangedAtById(
  userId: string,
): Promise<Date | null | undefined> {
  const row = await AppDataSource.getRepository(User).findOne({
    where: { id: userId },
    select: { id: true, passwordChangedAt: true },
  });

  if (!row) {
    return undefined;
  }

  return row.passwordChangedAt;
}
