export class EventError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "EventError";
  }
}

export class EventNotFoundError extends EventError {
  constructor(eventId: string) {
    super(`Event ${eventId} not found`, "EVENT_NOT_FOUND");
    this.name = "EventNotFoundError";
  }
}

export class EventAccessDeniedError extends EventError {
  constructor() {
    super("You do not have permission to manage this event", "EVENT_ACCESS_DENIED");
    this.name = "EventAccessDeniedError";
  }
}
