/**
 * @file Lógica pura de decisão do gate de checkout por participação.
 * @module modules/participation/application/helpers/resolveParticipationAccess
 */

import { EventType } from "../../../../shared/kernel/enums";

export type ParticipationDenialReason = "NOT_APPROVED" | "LOT_NOT_ALLOWED";

export interface ParticipationAccess {
  /** Indica se o evento exige aprovação prévia (privado). */
  requiresApproval: boolean;
  /** Indica se o usuário está liberado para checkout neste lote. */
  allowed: boolean;
  /** Motivo do bloqueio quando `allowed` é false em evento privado. */
  denialReason?: ParticipationDenialReason;
}

/**
 * Decide o acesso ao checkout a partir do tipo do evento e da aprovação.
 * Eventos públicos são sempre liberados; privados exigem aprovação e lote liberado.
 */
export function resolveParticipationAccess(
  eventType: EventType | null,
  hasApprovedRequest: boolean,
  ticketLotId: string | null,
  allowedTicketLotIds: string[] | null,
): ParticipationAccess {
  if (eventType !== EventType.PRIVATE) {
    return { requiresApproval: false, allowed: true };
  }

  if (!hasApprovedRequest) {
    return {
      requiresApproval: true,
      allowed: false,
      denialReason: "NOT_APPROVED",
    };
  }

  // Legacy / backfill incompleto: null trata como todos os lotes.
  if (allowedTicketLotIds === null) {
    return { requiresApproval: true, allowed: true };
  }

  if (
    !ticketLotId ||
    allowedTicketLotIds.length === 0 ||
    !allowedTicketLotIds.includes(ticketLotId)
  ) {
    return {
      requiresApproval: true,
      allowed: false,
      denialReason: "LOT_NOT_ALLOWED",
    };
  }

  return { requiresApproval: true, allowed: true };
}
