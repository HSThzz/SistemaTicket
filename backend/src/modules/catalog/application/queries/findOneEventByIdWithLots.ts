/**
 * @file Query: busca evento por ID com lotes carregados.
 * @module modules/catalog/application/queries/findOneEventByIdWithLots
 */

import type { DataSource } from "typeorm";
import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";

export async function findOneEventByIdWithLots(
  dataSource: DataSource,
  eventId: string,
): Promise<Event | null> {
  return dataSource.getRepository(Event).findOne({
    where: { id: eventId },
    relations: { ticketLots: true },
  });
}
