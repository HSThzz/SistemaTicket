/**
 * @file Command: arquiva evento (soft delete) na lista do produtor.
 * @module modules/catalog/application/commands/archiveEvent
 */

import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function archiveEvent(event: Event): Promise<Event> {
  event.deletedAt = new Date();
  return AppDataSource.getRepository(Event).save(event);
}
