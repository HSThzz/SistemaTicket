/**
 * @file Command: invalida tokens de redefinição pendentes de um usuário.
 * @module modules/identity/application/commands/invalidatePasswordResetTokensForUser
 */

import { PasswordResetToken } from "../../../../shared/infrastructure/persistence/entities/PasswordResetToken";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function invalidatePasswordResetTokensForUser(
  userId: string,
): Promise<void> {
  await AppDataSource.getRepository(PasswordResetToken)
    .createQueryBuilder()
    .delete()
    .where("user_id = :userId", { userId })
    .andWhere("used_at IS NULL")
    .execute();
}
