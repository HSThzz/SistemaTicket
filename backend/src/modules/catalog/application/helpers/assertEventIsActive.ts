import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { EventNotFoundError } from "../../domain/errors/EventError";

export function assertEventIsActive(event: Event): void {
  if (event.deletedAt) {
    throw new EventNotFoundError(event.id);
  }
}
