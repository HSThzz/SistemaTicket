import type { EventStatus, TicketStatus } from "../../../../shared/kernel/enums";

export class CheckInError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "CheckInError";
  }
}

export class TicketNotFoundError extends CheckInError {
  constructor() {
    super("Ticket not found", "TICKET_NOT_FOUND");
    this.name = "TicketNotFoundError";
  }
}

export class InvalidTicketStatusError extends CheckInError {
  constructor(public readonly currentStatus: TicketStatus) {
    super(
      `Ticket cannot be checked in. Current status: ${currentStatus}`,
      "INVALID_TICKET_STATUS",
    );
    this.name = "InvalidTicketStatusError";
  }
}

export class EventNotPublishedError extends CheckInError {
  constructor(public readonly eventStatus: EventStatus) {
    super(
      `Event is not published. Current status: ${eventStatus}`,
      "EVENT_NOT_PUBLISHED",
    );
    this.name = "EventNotPublishedError";
  }
}

export class CheckInNotAllowedTodayError extends CheckInError {
  constructor(public readonly eventDate: string) {
    super(
      `Check-in is only allowed on the event day (${eventDate})`,
      "CHECKIN_NOT_ALLOWED_TODAY",
    );
    this.name = "CheckInNotAllowedTodayError";
  }
}

export class CheckInAccessDeniedError extends CheckInError {
  constructor() {
    super("You do not have permission to check in tickets for this event", "CHECKIN_ACCESS_DENIED");
    this.name = "CheckInAccessDeniedError";
  }
}
