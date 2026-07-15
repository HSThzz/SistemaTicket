/**
 * @file Query: busca evento por ID sem relações.
 * @module modules/catalog/application/queries/findOneEventById
 */

import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneEventById(eventId: string,
): Promise<Event | null> {
  return AppDataSource.getRepository(Event)
    .createQueryBuilder("event")
    .where("event.id = :eventId", { eventId })
    .getOne();
}


