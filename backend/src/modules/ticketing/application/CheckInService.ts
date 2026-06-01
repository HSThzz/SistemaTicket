/**
 * @file Serviço de check-in de ingressos com lock pessimista e regras de negócio.
 * @module ticketing/application/CheckInService
 */

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

/**
 * Usuário que realiza o check-in (produtor do evento ou admin).
 */
export interface CheckInActor {
  userId: string;
  role: UserRole;
}

/**
 * Dados retornados após check-in bem-sucedido.
 */
export interface CheckInResult {
  ownerName: string;
  ownerDocument: string;
  checkedInAt: string;
  ticketId: string;
  eventTitle: string;
}

/**
 * Valida e registra entrada do portador pelo código único do ingresso.
 */
export class CheckInService {
  private readonly logger = Logger.getInstance();

  /**
   * @param dataSource - Conexão TypeORM para transações com lock.
   */
  constructor(private readonly dataSource: DataSource) {}

  /**
   * @param uniqueCode - Código QR/único do ingresso.
   * @param actor - Operador autenticado (admin ou produtor dono do evento).
   * @returns Dados do titular e horário do check-in.
   * @throws {TicketNotFoundError} Código inexistente.
   * @throws {CheckInAccessDeniedError} Produtor sem permissão no evento.
   * @throws {InvalidTicketStatusError} Ingresso não ativo.
   * @throws {EventNotPublishedError} Evento não publicado.
   * @throws {CheckInNotAllowedTodayError} Fora do dia do evento (SP).
   */
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
