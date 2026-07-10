/**
 * @file Command: marca token de redefinição como utilizado.
 * @module modules/identity/application/commands/markPasswordResetTokenUsed
 */

import { PasswordResetToken } from "../../../../shared/infrastructure/persistence/entities/PasswordResetToken";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function markPasswordResetTokenUsed(
  token: PasswordResetToken,
  usedAt = new Date(),
): Promise<PasswordResetToken> {
  token.usedAt = usedAt;
  return AppDataSource.getRepository(PasswordResetToken).save(token);
}
