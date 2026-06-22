/**
 * @file Command: aplica decisão (aprovar/recusar) numa solicitação de participação.
 * @module modules/participation/application/commands/reviewParticipationRequest
 */

import { ParticipationRequest } from "../../../../shared/infrastructure/persistence/entities/ParticipationRequest";
import { ParticipationRequestStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function reviewParticipationRequest(
  request: ParticipationRequest,
  status:
    | ParticipationRequestStatus.APPROVED
    | ParticipationRequestStatus.REJECTED,
  reviewerUserId: string,
): Promise<ParticipationRequest> {
  request.status = status;
  request.reviewedBy = reviewerUserId;
  request.reviewedAt = new Date();

  return AppDataSource.getRepository(ParticipationRequest).save(request);
}
