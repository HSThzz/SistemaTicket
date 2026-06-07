import { Logger } from "../../../../shared/infrastructure/config/logger";
import { EventStatus, TicketStatus, UserRole } from "../../../../shared/kernel/enums";
import {
  CheckInAccessDeniedError,
  CheckInNotAllowedTodayError,
  EventNotPublishedError,
  InvalidTicketStatusError,
  TicketNotFoundError,
} from "../../domain/errors/CheckInError";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { checkInSchema } from "../../validators/schema/checkInSchema";
import { checkInTicket } from "../commands/checkInTicket";
import { findOneTicketByUniqueCode } from "../queries/findOneTicketByUniqueCode";
import type { CheckInActor } from "./types";

const CONTEXT = "CheckInService";
const CHECK_IN_TIMEZONE = "America/Sao_Paulo";
const logger = Logger.getInstance();

export async function checkIn(uniqueCode: string, actor: CheckInActor) {
  const { uniqueCode: code } = validateSchema(checkInSchema, { uniqueCode });
  const ticket = await findOneTicketByUniqueCode(code);

  if (!ticket?.ticketLot?.event) {
    logger.warn(CONTEXT, "Check-in failed — ticket not found", {
      uniqueCode: code,
    });
    throw new TicketNotFoundError();
  }

  const event = ticket.ticketLot.event;

  if (actor.role !== UserRole.ADMIN && event.producerId !== actor.userId) {
    logger.warn(CONTEXT, "Check-in rejected — producer does not own event", {
      ticketId: ticket.id,
      eventId: event.id,
      actorUserId: actor.userId,
    });
    throw new CheckInAccessDeniedError();
  }

  if (ticket.status !== TicketStatus.ACTIVE) {
    logger.warn(
      CONTEXT,
      "Check-in rejected — invalid ticket status (possible duplicate or fraud)",
      {
        ticketId: ticket.id,
        uniqueCode: code,
        currentStatus: ticket.status,
        eventId: event.id,
        ownerDocument: ticket.ownerDocument,
      },
    );
    throw new InvalidTicketStatusError(ticket.status);
  }

  if (event.status !== EventStatus.PUBLISHED) {
    logger.warn(CONTEXT, "Check-in rejected — event not published", {
      ticketId: ticket.id,
      eventId: event.id,
      eventStatus: event.status,
    });
    throw new EventNotPublishedError(event.status);
  }

  if (!isEventDay(event.date)) {
    const eventDay = formatCalendarDay(event.date);

    logger.warn(CONTEXT, "Check-in rejected — wrong event day", {
      ticketId: ticket.id,
      eventId: event.id,
      eventDay,
      today: formatCalendarDay(new Date()),
    });
    throw new CheckInNotAllowedTodayError(eventDay);
  }

  const result = await checkInTicket(code);

  if (!result) {
    logger.warn(CONTEXT, "Check-in failed — ticket not found", {
      uniqueCode: code,
    });
    throw new TicketNotFoundError();
  }

  logger.info(CONTEXT, "Check-in completed successfully", {
    ticketId: result.ticketId,
    uniqueCode: code,
    eventId: event.id,
    eventTitle: result.eventTitle,
    checkedInAt: result.checkedInAt.toISOString(),
    ownerDocument: result.ownerDocument,
  });

  return {
    ownerName: result.ownerName,
    ownerDocument: result.ownerDocument,
    checkedInAt: result.checkedInAt.toISOString(),
    ticketId: result.ticketId,
    eventTitle: result.eventTitle,
  };
}

function isEventDay(eventDate: Date, referenceDate = new Date()): boolean {
  return formatCalendarDay(eventDate) === formatCalendarDay(referenceDate);
}

function formatCalendarDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CHECK_IN_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
