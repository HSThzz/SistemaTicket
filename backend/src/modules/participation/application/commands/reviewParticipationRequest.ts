/**
 * @file Command: aplica decisão (aprovar/recusar) de forma atômica em solicitação PENDING.
 * @module modules/participation/application/commands/reviewParticipationRequest
 */

import { ParticipationRequest } from "../../../../shared/infrastructure/persistence/entities/ParticipationRequest";
import { ParticipationRequestStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function reviewParticipationRequest(
  requestId: string,
  eventId: string,
  status:
    | ParticipationRequestStatus.APPROVED
    | ParticipationRequestStatus.REJECTED,
  reviewerUserId: string,
): Promise<ParticipationRequest | null> {
  const repository = AppDataSource.getRepository(ParticipationRequest);

  const result = await repository.update(
    {
      id: requestId,
      eventId,
      status: ParticipationRequestStatus.PENDING,
    },
    {
      status,
      reviewedBy: reviewerUserId,
      reviewedAt: new Date(),
    },
  );

  if (!result.affected) {
    return null;
  }

  return repository.findOneBy({ id: requestId });
}
