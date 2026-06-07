/**
 * @file Query: busca evento por ID sem relações.
 * @module modules/catalog/application/queries/findOneEventById
 */

import type { DataSource } from "typeorm";
import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";

export async function findOneEventById(
  dataSource: DataSource,
  eventId: string,
): Promise<Event | null> {
  return dataSource.getRepository(Event).findOne({
    where: { id: eventId },
  });
}
