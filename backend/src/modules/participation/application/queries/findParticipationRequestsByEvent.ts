/**
 * @file Query: lista solicitações de participação de um evento por status.
 * @module modules/participation/application/queries/findParticipationRequestsByEvent
 */

import { ParticipationRequest } from "../../../../shared/infrastructure/persistence/entities/ParticipationRequest";
import { ParticipationRequestStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findParticipationRequestsByEvent(
  eventId: string,
  status: ParticipationRequestStatus,
): Promise<ParticipationRequest[]> {
  return AppDataSource.getRepository(ParticipationRequest)
    .createQueryBuilder("request")
    .where("request.eventId = :eventId", { eventId })
    .andWhere("request.status = :status", { status })
    .orderBy("request.createdAt", "ASC")
    .getMany();
}
