/**
 * @file Command: registra check-in de ingresso em transação com lock pessimista.
 * @module modules/ticketing/application/commands/checkInTicket
 */

import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { TicketStatus } from "../../../../shared/kernel/enums";
import type { Prettify } from "../../../../shared/kernel/prettify";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { InvalidTicketStatusError } from "../../domain/errors/CheckInError";
import { resolveTicketLookupCodes } from "../../../../shared/kernel/ticketCheckInCode";

export type CheckInTicketResult = Prettify<
  Pick<Ticket, "ownerName" | "ownerDocument"> & {
    checkedInAt: NonNullable<Ticket["checkedInAt"]>;
    ticketId: Ticket["id"];
    eventTitle: Event["title"];
  }
>;

type CheckInTicketChanges = Prettify<
  Pick<Ticket, "status" | "checkedInAt"> & {
    checkedInAt: NonNullable<Ticket["checkedInAt"]>;
  }
>;

export async function checkInTicket(
  scannedCode: string,
): Promise<CheckInTicketResult | null> {
  const { compactCheckInCode, uniqueCode } = resolveTicketLookupCodes(scannedCode);

  return AppDataSource.transaction(async (manager) => {
    const locked = uniqueCode
      ? await manager.findOne(Ticket, {
          where: { uniqueCode },
          lock: { mode: "pessimistic_write" },
        })
      : await manager.findOne(Ticket, {
          where: { checkInCode: compactCheckInCode },
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

    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new InvalidTicketStatusError(ticket.status);
    }

    const checkedInAt = new Date();
    const changes: CheckInTicketChanges = {
      status: TicketStatus.USED,
      checkedInAt,
    };

    Object.assign(ticket, changes);
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
