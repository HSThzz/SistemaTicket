/**
 * @file Query: busca marcador de troca de senha por ID de usuário.
 * @module modules/identity/application/queries/findUserPasswordChangedAtById
 */

import { findUserAuthStateById } from "./findUserAuthStateById";

/**
 * @returns `undefined` se o usuário não existir; caso contrário, data ou `null`.
 * @deprecated Prefira `findUserAuthStateById` quando também precisar da role.
 */
export async function findUserPasswordChangedAtById(
  userId: string,
): Promise<Date | null | undefined> {
  const authState = await findUserAuthStateById(userId);

  if (!authState) {
    return undefined;
  }

  return authState.passwordChangedAt;
}
