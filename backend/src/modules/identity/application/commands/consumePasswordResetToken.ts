/**
 * @file Command: consome token de redefinição de forma atômica (uso único).
 * @module modules/identity/application/commands/consumePasswordResetToken
 */

import { PasswordResetToken } from "../../../../shared/infrastructure/persistence/entities/PasswordResetToken";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import type { EntityManager } from "typeorm";

/**
 * Marca o token como usado somente se ainda estiver válido e não utilizado.
 * @returns `true` se esta chamada consumiu o token com sucesso.
 */
export async function consumePasswordResetToken(
  tokenId: string,
  usedAt = new Date(),
  manager?: EntityManager,
): Promise<boolean> {
  const repository = manager
    ? manager.getRepository(PasswordResetToken)
    : AppDataSource.getRepository(PasswordResetToken);

  const result = await repository
    .createQueryBuilder()
    .update(PasswordResetToken)
    .set({ usedAt })
    .where("id = :id", { id: tokenId })
    .andWhere("used_at IS NULL")
    .andWhere("expires_at > :now", { now: usedAt })
    .execute();

  return (result.affected ?? 0) === 1;
}
