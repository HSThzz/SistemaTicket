import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { EventNotFoundError } from "../../domain/errors/EventError";
import { findOneEventByIdWithLots } from "../queries/findOneEventByIdWithLots";

export async function loadEventWithLots(
  eventId: string,
): Promise<Event> {
  const event = await findOneEventByIdWithLots(eventId);

  if (!event) {
    throw new EventNotFoundError(eventId);
  }

  return event;
}
