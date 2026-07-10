/**
 * @file Command: persiste token de redefinição de senha.
 * @module modules/identity/application/commands/createPasswordResetToken
 */

import { PasswordResetToken } from "../../../../shared/infrastructure/persistence/entities/PasswordResetToken";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export type CreatePasswordResetTokenData = Pick<
  PasswordResetToken,
  "userId" | "tokenHash" | "expiresAt"
>;

export async function createPasswordResetToken(
  data: CreatePasswordResetTokenData,
): Promise<PasswordResetToken> {
  const repository = AppDataSource.getRepository(PasswordResetToken);
  const token = repository.create(data);
  return repository.save(token);
}
