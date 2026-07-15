/**
 * @file Command: atualiza lotes liberados de uma solicitação APPROVED.
 * @module modules/participation/application/commands/updateAllowedTicketLots
 */

import { ParticipationRequest } from "../../../../shared/infrastructure/persistence/entities/ParticipationRequest";
import { ParticipationRequestStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function updateAllowedTicketLots(
  requestId: string,
  eventId: string,
  allowedTicketLotIds: string[],
): Promise<ParticipationRequest | null> {
  const repository = AppDataSource.getRepository(ParticipationRequest);

  const result = await repository.update(
    {
      id: requestId,
      eventId,
      status: ParticipationRequestStatus.APPROVED,
    },
    { allowedTicketLotIds },
  );

  if (!result.affected) {
    return null;
  }

  return repository
    .createQueryBuilder("request")
    .where("request.id = :requestId", { requestId })
    .getOne();
}
