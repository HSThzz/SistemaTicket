/**
 * @file Query: lista solicitações de participação de um usuário autenticado.
 * @module modules/participation/application/queries/findParticipationRequestsByUserId
 */

import { ParticipationRequest } from "../../../../shared/infrastructure/persistence/entities/ParticipationRequest";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findParticipationRequestsByUserId(
  userId: string,
): Promise<ParticipationRequest[]> {
  return AppDataSource.getRepository(ParticipationRequest).find({
    where: { userId },
    order: { createdAt: "DESC" },
  });
}
