/**
 * @file Query: lista solicitações de participação de um usuário autenticado.
 * @module modules/participation/application/queries/findParticipationRequestsByUserId
 */

import { ParticipationRequest } from "../../../../shared/infrastructure/persistence/entities/ParticipationRequest";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findParticipationRequestsByUserId(
  userId: string,
): Promise<ParticipationRequest[]> {
  return AppDataSource.getRepository(ParticipationRequest)
    .createQueryBuilder("request")
    .where("request.userId = :userId", { userId })
    .orderBy("request.createdAt", "DESC")
    .getMany();
}
