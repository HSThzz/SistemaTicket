/**
 * @file Serviço de gate de checkout: avalia se um usuário pode comprar em um lote.
 * @module modules/participation/application/services/checkParticipationAccess
 *
 * Para eventos públicos o checkout é sempre liberado. Para eventos privados,
 * exige solicitação APROVADA e que o lote esteja em `allowedTicketLotIds`.
 */

import { EventType } from "../../../../shared/kernel/enums";
import {
  resolveParticipationAccess,
  type ParticipationAccess,
} from "../helpers/resolveParticipationAccess";
import { findApprovedParticipationForUser } from "../queries/findApprovedParticipationForUser";
import { findEventVisibilityByTicketLotId } from "../queries/findEventVisibilityByTicketLotId";

export type { ParticipationAccess } from "../helpers/resolveParticipationAccess";

/**
 * Avalia o acesso de `userId` ao checkout do lote `ticketLotId`.
 * Eventos inexistentes/lotes inválidos são tratados como liberados aqui;
 * a validação de existência do lote permanece no fluxo de reserva.
 */
export async function checkParticipationAccess(
  userId: string,
  ticketLotId: string,
): Promise<ParticipationAccess> {
  const visibility = await findEventVisibilityByTicketLotId(ticketLotId);

  if (!visibility || visibility.type !== EventType.PRIVATE) {
    return resolveParticipationAccess(visibility?.type ?? null, false, null, null);
  }

  const approval = await findApprovedParticipationForUser(
    visibility.eventId,
    userId,
  );

  return resolveParticipationAccess(
    visibility.type,
    Boolean(approval),
    ticketLotId,
    approval?.allowedTicketLotIds ?? null,
  );
}
