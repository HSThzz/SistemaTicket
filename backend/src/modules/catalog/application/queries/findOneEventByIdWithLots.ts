/**
 * @file Query: busca evento por ID com lotes carregados.
 * @module modules/catalog/application/queries/findOneEventByIdWithLots
 */

import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneEventByIdWithLots(eventId: string,
): Promise<Event | null> {
  return AppDataSource.getRepository(Event)
    .createQueryBuilder("event")
    .leftJoinAndSelect("event.ticketLots", "ticketLots")
    .where("event.id = :eventId", { eventId })
    .getOne();
}


