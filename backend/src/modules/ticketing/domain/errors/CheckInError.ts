/**
 * @file Erros de domínio do check-in de ingressos na portaria.
 * @module ticketing/domain/errors/CheckInError
 */

import type { EventStatus, TicketStatus } from "../../../../shared/kernel/enums";

/**
 * Erro base para validações de check-in.
 */
export class CheckInError extends Error {
  /**
   * @param message - Mensagem legível.
   * @param code - Código estável para API.
   */
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "CheckInError";
  }
}

/**
 * Ingresso não encontrado pelo código único (QR).
 */
export class TicketNotFoundError extends CheckInError {
  constructor() {
    super("Ticket not found", "TICKET_NOT_FOUND");
    this.name = "TicketNotFoundError";
  }
}

/**
 * Status do ingresso impede check-in (ex.: já utilizado).
 */
export class InvalidTicketStatusError extends CheckInError {
  /**
   * @param currentStatus - Status atual do ingresso.
   */
  constructor(public readonly currentStatus: TicketStatus) {
    super(
      `Ticket cannot be checked in. Current status: ${currentStatus}`,
      "INVALID_TICKET_STATUS",
    );
    this.name = "InvalidTicketStatusError";
  }
}

/**
 * Evento associado ao ingresso não está publicado.
 */
export class EventNotPublishedError extends CheckInError {
  /**
   * @param eventStatus - Status atual do evento.
   */
  constructor(public readonly eventStatus: EventStatus) {
    super(
      `Event is not published. Current status: ${eventStatus}`,
      "EVENT_NOT_PUBLISHED",
    );
    this.name = "EventNotPublishedError";
  }
}

/**
 * Check-in só é permitido no dia do evento (fuso America/Sao_Paulo).
 */
export class CheckInNotAllowedTodayError extends CheckInError {
  /**
   * @param eventDate - Data do evento formatada (YYYY-MM-DD).
   */
  constructor(public readonly eventDate: string) {
    super(
      `Check-in is only allowed on the event day (${eventDate})`,
      "CHECKIN_NOT_ALLOWED_TODAY",
    );
    this.name = "CheckInNotAllowedTodayError";
  }
}

/**
 * Produtor tentou check-in em evento de outro produtor (não admin).
 */
export class CheckInAccessDeniedError extends CheckInError {
  constructor() {
    super("You do not have permission to check in tickets for this event", "CHECKIN_ACCESS_DENIED");
    this.name = "CheckInAccessDeniedError";
  }
}
