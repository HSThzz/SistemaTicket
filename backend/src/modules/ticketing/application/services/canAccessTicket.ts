import { UserRole } from "../../../../shared/kernel/enums";
import { findOneTicketForAccessCheck } from "../queries/findOneTicketForAccessCheck";

export interface WalletActor {
  userId: string;
  role: UserRole;
}

export async function canAccessTicket(
  ticketId: string,
  actor: WalletActor,
) {
  if (actor.role === UserRole.ADMIN) {
    return true;
  }

  const ticket = await findOneTicketForAccessCheck(ticketId);

  if (!ticket?.order || !ticket.ticketLot?.event) {
    return false;
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
