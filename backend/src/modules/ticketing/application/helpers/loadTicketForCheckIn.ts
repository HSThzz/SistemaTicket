/**
 * @file Carrega ingresso e valida regras de check-in (sem marcar como usado).
 * @module modules/ticketing/application/helpers/loadTicketForCheckIn
 */

import type { EntityManager } from "typeorm";
import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { EventStatus, TicketStatus } from "../../../../shared/kernel/enums";
import { resolveTicketLookupCodes } from "../../../../shared/kernel/ticketCheckInCode";
import {
  CheckInAccessDeniedError,
  CheckInNotAllowedTodayError,
  EventNotPublishedError,
  InvalidTicketStatusError,
} from "../../domain/errors/CheckInError";
import { formatCalendarDay, isEventDay } from "./eventDay";
import { canCheckInForEvent } from "./canCheckInForEvent";
import type { CheckInActor } from "../services/types";

const CHECK_IN_ALLOWED_EVENT_STATUSES = new Set<EventStatus>([
  EventStatus.PUBLISHED,
  EventStatus.FINISHED,
]);

export type TicketReadyForCheckIn = {
  ticket: Ticket;
  event: Event;
  lot: TicketLot;
};

/**
 * Localiza o ingresso pelo código e aplica as mesmas regras da portaria.
 * Com `lockForUpdate`, usa lock pessimista (fluxo de confirmação).
 */
export async function loadTicketForCheckIn(
  manager: EntityManager,
  scannedCode: string,
  actor: CheckInActor,
  options: { lockForUpdate: boolean },
): Promise<TicketReadyForCheckIn | null> {
  const { compactCheckInCode, uniqueCode } = resolveTicketLookupCodes(scannedCode);

  const locked = uniqueCode
    ? await manager.findOne(Ticket, {
        where: { uniqueCode },
        ...(options.lockForUpdate ? { lock: { mode: "pessimistic_write" as const } } : {}),
      })
    : await manager.findOne(Ticket, {
        where: { checkInCode: compactCheckInCode },
        ...(options.lockForUpdate ? { lock: { mode: "pessimistic_write" as const } } : {}),
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
  const lot = ticket.ticketLot;

  if (!(await canCheckInForEvent(actor, event, manager))) {
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

  return { ticket, event, lot };
}
