/**
 * @file Command: persiste novo evento.
 * @module modules/catalog/application/commands/createEvent
 */

import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import type { Prettify } from "../../../../shared/kernel/prettify";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export type CreateEventData = Prettify<
  Pick<
    Event,
    | "producerId"
    | "title"
    | "description"
    | "date"
    | "location"
    | "imageUrl"
    | "status"
  >
>;

export async function createEvent(data: CreateEventData,
): Promise<Event> {
  const repository = AppDataSource.getRepository(Event);
  const event = repository.create(data);
  return repository.save(event);
}
