/**
 * @file Query: verifica solicitação existente de um usuário para um evento.
 * @module modules/participation/application/queries/findExistingParticipationRequest
 */

import { ParticipationRequest } from "../../../../shared/infrastructure/persistence/entities/ParticipationRequest";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findExistingParticipationRequest(
  eventId: string,
  userId: string,
): Promise<ParticipationRequest | null> {
  return AppDataSource.getRepository(ParticipationRequest).findOne({
    where: { eventId, userId },
  });
}
