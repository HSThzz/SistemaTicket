/**
 * @file Lógica pura de decisão do gate de checkout por participação.
 * @module modules/participation/application/helpers/resolveParticipationAccess
 */

import { EventType } from "../../../../shared/kernel/enums";

export interface ParticipationAccess {
  /** Indica se o evento exige aprovação prévia (privado). */
  requiresApproval: boolean;
  /** Indica se o usuário está liberado para checkout. */
  allowed: boolean;
}

/**
 * Decide o acesso ao checkout a partir do tipo do evento e da contagem de aprovações.
 * Eventos públicos (ou sem evento associado) são sempre liberados; privados exigem
 * ao menos uma solicitação aprovada.
 * @param eventType - Tipo do evento ou `null` quando não resolvido.
 * @param approvedCount - Quantidade de solicitações aprovadas do usuário no evento.
 */
export function resolveParticipationAccess(
  eventType: EventType | null,
  approvedCount: number,
): ParticipationAccess {
  if (eventType !== EventType.PRIVATE) {
    return { requiresApproval: false, allowed: true };
  }

  return { requiresApproval: true, allowed: approvedCount > 0 };
}
