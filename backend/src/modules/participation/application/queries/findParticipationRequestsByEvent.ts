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
  const qb = AppDataSource.getRepository(ParticipationRequest)
    .createQueryBuilder("request")
    .where("request.eventId = :eventId", { eventId })
    .andWhere("request.status = :status", { status });

  // Fila de análise: mais antigas primeiro. Aprovadas/recusadas: A–Z.
  if (status === ParticipationRequestStatus.PENDING) {
    qb.orderBy("request.createdAt", "ASC");
  } else {
    qb.orderBy("LOWER(request.name)", "ASC").addOrderBy(
      "request.createdAt",
      "ASC",
    );
  }

  return qb.getMany();
}
