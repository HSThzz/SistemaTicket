/**
 * @file Query: conta solicitações pendentes por evento (batch).
 * @module modules/participation/application/queries/countPendingParticipationByEventIds
 */

import { ParticipationRequest } from "../../../../shared/infrastructure/persistence/entities/ParticipationRequest";
import { ParticipationRequestStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function countPendingParticipationByEventIds(
  eventIds: string[],
): Promise<Map<string, number>> {
  if (eventIds.length === 0) {
    return new Map();
  }

  const rows = await AppDataSource.getRepository(ParticipationRequest)
    .createQueryBuilder("request")
    .select("request.eventId", "eventId")
    .addSelect("COUNT(request.id)", "count")
    .where("request.eventId IN (:...eventIds)", { eventIds })
    .andWhere("request.status = :status", {
      status: ParticipationRequestStatus.PENDING,
    })
    .groupBy("request.eventId")
    .getRawMany<{ eventId: string; count: string }>();

  return new Map(rows.map((row) => [row.eventId, Number(row.count)]));
}
