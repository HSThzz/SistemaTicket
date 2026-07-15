/**
 * @file Query: busca token de redefinição válido pelo hash.
 * @module modules/identity/application/queries/findValidPasswordResetTokenByHash
 */

import { PasswordResetToken } from "../../../../shared/infrastructure/persistence/entities/PasswordResetToken";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findValidPasswordResetTokenByHash(
  tokenHash: string,
): Promise<PasswordResetToken | null> {
  return AppDataSource.getRepository(PasswordResetToken)
    .createQueryBuilder("token")
    .leftJoinAndSelect("token.user", "user")
    .where("token.tokenHash = :tokenHash", { tokenHash })
    .getOne();
}
