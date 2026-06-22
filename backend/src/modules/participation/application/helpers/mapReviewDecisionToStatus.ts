/**
 * @file Lógica pura de mapeamento da decisão do produtor para status persistido.
 * @module modules/participation/application/helpers/mapReviewDecisionToStatus
 */

import { ParticipationRequestStatus } from "../../../../shared/kernel/enums";
import { ParticipationReviewDecision } from "../../validators/schema/reviewParticipationRequestSchema";

/**
 * Converte a decisão (APPROVE/REJECT) no status final da solicitação.
 */
export function mapReviewDecisionToStatus(
  decision: ParticipationReviewDecision,
):
  | ParticipationRequestStatus.APPROVED
  | ParticipationRequestStatus.REJECTED {
  return decision === ParticipationReviewDecision.APPROVE
    ? ParticipationRequestStatus.APPROVED
    : ParticipationRequestStatus.REJECTED;
}
