/**
 * @file Query: verifica se o evento já possui solicitações de participação.
 * @module modules/participation/application/queries/hasParticipationRequestsForEvent
 */

import { ParticipationRequest } from "../../../../shared/infrastructure/persistence/entities/ParticipationRequest";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function hasParticipationRequestsForEvent(
  eventId: string,
): Promise<boolean> {
  const count = await AppDataSource.getRepository(ParticipationRequest)
    .createQueryBuilder("request")
    .where("request.eventId = :eventId", { eventId })
    .getCount();

  return count > 0;
}
