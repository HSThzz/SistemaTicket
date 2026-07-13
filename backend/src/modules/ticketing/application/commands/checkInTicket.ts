/**
 * @file Command: registra check-in de ingresso em transação com lock pessimista.
 * @module modules/ticketing/application/commands/checkInTicket
 */

import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { EventStatus, TicketStatus } from "../../../../shared/kernel/enums";
import { isStaffRole } from "../../../../shared/kernel/staffRoles";
import type { Prettify } from "../../../../shared/kernel/prettify";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { resolveTicketLookupCodes } from "../../../../shared/kernel/ticketCheckInCode";
import {
  CheckInAccessDeniedError,
  CheckInNotAllowedTodayError,
  EventNotPublishedError,
  InvalidTicketStatusError,
} from "../../domain/errors/CheckInError";
import { formatCalendarDay, isEventDay } from "../helpers/eventDay";
import type { CheckInActor } from "../services/types";

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

const CHECK_IN_ALLOWED_EVENT_STATUSES = new Set<EventStatus>([
  EventStatus.PUBLISHED,
  EventStatus.FINISHED,
]);

/**
 * Valida ownership, status do ingresso/evento e dia — tudo sob lock pessimista.
 */
export async function checkInTicket(
  scannedCode: string,
  actor: CheckInActor,
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

    const event = ticket.ticketLot.event;

    if (!isStaffRole(actor.role) && event.producerId !== actor.userId) {
      throw new CheckInAccessDeniedError();
    }

    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new InvalidTicketStatusError(ticket.status);
    }

    if (!CHECK_IN_ALLOWED_EVENT_STATUSES.has(event.status)) {
      throw new EventNotPublishedError(event.status);
    }

    if (!isEventDay(event.date)) {
      throw new CheckInNotAllowedTodayError(formatCalendarDay(event.date));
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
      eventTitle: event.title,
    };
  });
}
