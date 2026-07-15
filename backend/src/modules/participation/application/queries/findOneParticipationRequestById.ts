/**
 * @file Query: busca solicitação de participação por ID.
 * @module modules/participation/application/queries/findOneParticipationRequestById
 */

import { ParticipationRequest } from "../../../../shared/infrastructure/persistence/entities/ParticipationRequest";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneParticipationRequestById(
  requestId: string,
): Promise<ParticipationRequest | null> {
  return AppDataSource.getRepository(ParticipationRequest)
    .createQueryBuilder("request")
    .where("request.id = :requestId", { requestId })
    .getOne();
}
