/**
 * @file Interpreta solicitação existente (bloqueio vs recusa anterior).
 * @module modules/participation/application/helpers/assertNoBlockingParticipationRequest
 */

import type { ParticipationRequest } from "../../../../shared/infrastructure/persistence/entities/ParticipationRequest";
import { ParticipationRequestStatus } from "../../../../shared/kernel/enums";
import {
  ParticipationAlreadyRequestedError,
  ParticipationPreviouslyRejectedError,
} from "../../domain/errors/ParticipationError";

/** Lança erro adequado se já existir pedido para o evento. */
export function assertNoBlockingParticipationRequest(
  existing: ParticipationRequest | null,
): void {
  if (!existing) {
    return;
  }

  if (existing.status === ParticipationRequestStatus.REJECTED) {
    throw new ParticipationPreviouslyRejectedError();
  }

  throw new ParticipationAlreadyRequestedError();
}
