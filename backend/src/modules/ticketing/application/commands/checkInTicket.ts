/**
 * @file Command: registra check-in de ingresso em transação com lock pessimista.
 * @module modules/ticketing/application/commands/checkInTicket
 */

import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { TicketStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export interface CheckInTicketResult {
  ownerName: string;
  ownerDocument: string;
  checkedInAt: Date;
  ticketId: string;
  eventTitle: string;
}

export async function checkInTicket(uniqueCode: string,
): Promise<CheckInTicketResult | null> {
  return AppDataSource.transaction(async (manager) => {
    const locked = await manager.findOne(Ticket, {
      where: { uniqueCode },
      lock: { mode: "pessimistic_write" },
    });

    if (!locked) {
      return null;
    }

    const ticket = await manager.findOne(Ticket, {
      where: { id: locked.id },
      relations: { ticketLot: { event: true } },
    });

    if (!ticket?.ticketLot?.event) {
      return null;
    }

    const checkedInAt = new Date();

    ticket.status = TicketStatus.USED;
    ticket.checkedInAt = checkedInAt;
    await manager.save(ticket);

    return {
      ownerName: ticket.ownerName,
      ownerDocument: ticket.ownerDocument,
      checkedInAt,
      ticketId: ticket.id,
      eventTitle: ticket.ticketLot.event.title,
    };
  });
}


