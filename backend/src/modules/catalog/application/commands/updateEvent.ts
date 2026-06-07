/**
 * @file Command: persiste alterações em evento existente.
 * @module modules/catalog/application/commands/updateEvent
 */

import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function updateEvent(event: Event,
): Promise<Event> {
  return AppDataSource.getRepository(Event).save(event);
}


