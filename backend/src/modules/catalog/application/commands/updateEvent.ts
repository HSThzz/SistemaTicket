/**
 * @file Command: persiste alterações em evento existente.
 * @module modules/catalog/application/commands/updateEvent
 */

import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import type { Prettify } from "../../../../shared/kernel/prettify";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export type UpdateEventData = Prettify<
  Partial<
    Pick<
      Event,
      | "title"
      | "description"
      | "date"
      | "location"
      | "imageUrl"
      | "status"
    >
  >
>;

export async function updateEvent(
  event: Event,
  changes?: UpdateEventData,
): Promise<Event> {
  if (changes) {
    Object.assign(event, changes);
  }

  return AppDataSource.getRepository(Event).save(event);
}
