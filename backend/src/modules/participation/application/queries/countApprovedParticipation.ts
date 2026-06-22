/**
 * @file Query: conta solicitações APROVADAS de um usuário para um evento (gate de checkout).
 * @module modules/participation/application/queries/countApprovedParticipation
 */

import { ParticipationRequest } from "../../../../shared/infrastructure/persistence/entities/ParticipationRequest";
import { ParticipationRequestStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function countApprovedParticipation(
  eventId: string,
  userId: string,
): Promise<number> {
  return AppDataSource.getRepository(ParticipationRequest).count({
    where: {
      eventId,
      userId,
      status: ParticipationRequestStatus.APPROVED,
    },
  });
}
