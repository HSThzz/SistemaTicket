import type { DataSource } from "typeorm";
import { Logger } from "../../../shared/infrastructure/config/logger";
import { Ticket } from "../../../shared/infrastructure/persistence/entities/Ticket";
import { EventStatus, TicketStatus, UserRole } from "../../../shared/kernel/enums";
import {
  CheckInAccessDeniedError,
  CheckInNotAllowedTodayError,
  EventNotPublishedError,
  InvalidTicketStatusError,
  TicketNotFoundError,
} from "../domain/errors/CheckInError";

const CONTEXT = "CheckInService";
const CHECK_IN_TIMEZONE = "America/Sao_Paulo";

export interface CheckInActor {
  userId: string;
  role: UserRole;
}

export interface CheckInResult {
  ownerName: string;
  ownerDocument: string;
  checkedInAt: string;
  ticketId: string;
  eventTitle: string;
}

export class CheckInService {
  private readonly logger = Logger.getInstance();

  constructor(private readonly dataSource: DataSource) {}

  async checkIn(uniqueCode: string, actor: CheckInActor): Promise<CheckInResult> {
    return this.dataSource.transaction(async (manager) => {
      const locked = await manager.findOne(Ticket, {
        where: { uniqueCode },
        lock: { mode: "pessimistic_write" },
      });

      if (!locked) {
        this.logger.warn(CONTEXT, "Check-in failed — ticket not found", {
          uniqueCode,
        });
        throw new TicketNotFoundError();
      }

      const ticket = await manager.findOne(Ticket, {
        where: { id: locked.id },
        relations: { ticketLot: { event: true } },
      });

      if (!ticket?.ticketLot?.event) {
        this.logger.warn(CONTEXT, "Check-in failed — ticket not found", {
          uniqueCode,
        });
        throw new TicketNotFoundError();
      }

      const event = ticket.ticketLot.event;

      if (
        actor.role !== UserRole.ADMIN &&
        event.producerId !== actor.userId
      ) {
        this.logger.warn(CONTEXT, "Check-in rejected — producer does not own event", {
          ticketId: ticket.id,
          eventId: event.id,
          actorUserId: actor.userId,
        });
        throw new CheckInAccessDeniedError();
      }

      if (ticket.status !== TicketStatus.ACTIVE) {
        this.logger.warn(
          CONTEXT,
          "Check-in rejected — invalid ticket status (possible duplicate or fraud)",
          {
            ticketId: ticket.id,
            uniqueCode,
            currentStatus: ticket.status,
            eventId: event.id,
            ownerDocument: ticket.ownerDocument,
          },
        );
        throw new InvalidTicketStatusError(ticket.status);
      }

      if (event.status !== EventStatus.PUBLISHED) {
        this.logger.warn(CONTEXT, "Check-in rejected — event not published", {
          ticketId: ticket.id,
          eventId: event.id,
          eventStatus: event.status,
        });
        throw new EventNotPublishedError(event.status);
      }

      if (!isEventDay(event.date)) {
        const eventDay = formatCalendarDay(event.date);

        this.logger.warn(CONTEXT, "Check-in rejected — wrong event day", {
          ticketId: ticket.id,
          eventId: event.id,
          eventDay,
          today: formatCalendarDay(new Date()),
        });
        throw new CheckInNotAllowedTodayError(eventDay);
      }

      const checkedInAt = new Date();

      ticket.status = TicketStatus.USED;
      ticket.checkedInAt = checkedInAt;
      await manager.save(ticket);

      this.logger.info(CONTEXT, "Check-in completed successfully", {
        ticketId: ticket.id,
        uniqueCode,
        eventId: event.id,
        eventTitle: event.title,
        checkedInAt: checkedInAt.toISOString(),
        ownerDocument: ticket.ownerDocument,
      });

      return {
        ownerName: ticket.ownerName,
        ownerDocument: ticket.ownerDocument,
        checkedInAt: checkedInAt.toISOString(),
        ticketId: ticket.id,
        eventTitle: event.title,
      };
    });
  }
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
