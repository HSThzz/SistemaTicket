import type { DataSource } from "typeorm";
import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { EventNotFoundError } from "../../domain/errors/EventError";
import { findOneEventByIdWithLots } from "../queries/findOneEventByIdWithLots";

export async function loadEventWithLots(
  dataSource: DataSource,
  eventId: string,
): Promise<Event> {
  const event = await findOneEventByIdWithLots(dataSource, eventId);

  if (!event) {
    throw new EventNotFoundError(eventId);
  }

  return event;
}
