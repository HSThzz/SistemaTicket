import { TicketStatus, UserRole } from "../../../../shared/kernel/enums";
import { isStaffRole } from "../../../../shared/kernel/staffRoles";
import { findOneTicketForAccessCheck } from "../queries/findOneTicketForAccessCheck";

export interface WalletActor {
  userId: string;
  role: UserRole;
}

/**
 * Verifica se o ator pode acessar o ingresso (wallet / passes).
 * Ingressos cancelados (reembolso) não geram pass.
 */
export async function canAccessTicket(
  ticketId: string,
  actor: WalletActor,
) {
  const ticket = await findOneTicketForAccessCheck(ticketId);

  if (!ticket?.order || !ticket.ticketLot?.event) {
    return false;
  }

  if (ticket.status === TicketStatus.CANCELLED) {
    return false;
  }

  if (isStaffRole(actor.role)) {
    return true;
  }

  if (ticket.order.userId === actor.userId) {
    return true;
  }

  if (
    actor.role === UserRole.PRODUCER &&
    ticket.ticketLot.event.producerId === actor.userId
  ) {
    return true;
  }

  return false;
}
