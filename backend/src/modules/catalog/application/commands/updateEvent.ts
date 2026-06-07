/**
 * @file Command: persiste alterações em evento existente.
 * @module modules/catalog/application/commands/updateEvent
 */

import type { DataSource } from "typeorm";
import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";

export async function updateEvent(
  dataSource: DataSource,
  event: Event,
): Promise<Event> {
  return dataSource.getRepository(Event).save(event);
}
