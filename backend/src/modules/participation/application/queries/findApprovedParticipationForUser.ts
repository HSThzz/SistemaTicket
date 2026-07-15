/**
 * @file Query: solicitação APPROVED do usuário no evento (com lotes liberados).
 * @module modules/participation/application/queries/findApprovedParticipationForUser
 */

import { ParticipationRequest } from "../../../../shared/infrastructure/persistence/entities/ParticipationRequest";
import { ParticipationRequestStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findApprovedParticipationForUser(
  eventId: string,
  userId: string,
): Promise<ParticipationRequest | null> {
  return AppDataSource.getRepository(ParticipationRequest)
    .createQueryBuilder("request")
    .where("request.eventId = :eventId", { eventId })
    .andWhere("request.userId = :userId", { userId })
    .andWhere("request.status = :status", {
      status: ParticipationRequestStatus.APPROVED,
    })
    .getOne();
}
