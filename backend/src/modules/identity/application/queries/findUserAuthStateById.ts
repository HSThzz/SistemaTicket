/**
 * @file Query: estado de autenticação do usuário (role + marcador de senha).
 * @module modules/identity/application/queries/findUserAuthStateById
 */

import { User } from "../../../../shared/infrastructure/persistence/entities/User";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import type { UserRole } from "../../../../shared/kernel/enums";

export type UserAuthState = {
  role: UserRole;
  passwordChangedAt: Date | null;
};

/**
 * @returns `undefined` se o usuário não existir.
 */
export async function findUserAuthStateById(
  userId: string,
): Promise<UserAuthState | undefined> {
  const row = await AppDataSource.getRepository(User)
    .createQueryBuilder("user")
    .select(["user.id", "user.role", "user.passwordChangedAt"])
    .where("user.id = :userId", { userId })
    .getOne();

  if (!row) {
    return undefined;
  }

  return {
    role: row.role,
    passwordChangedAt: row.passwordChangedAt,
  };
}
