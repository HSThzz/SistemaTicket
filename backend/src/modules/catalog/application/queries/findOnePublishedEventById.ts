/**
 * @file Query: busca evento publicado por ID com lotes.
 * @module modules/catalog/application/queries/findOnePublishedEventById
 */

import type { DataSource } from "typeorm";
import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { EventStatus } from "../../../../shared/kernel/enums";

export async function findOnePublishedEventById(
  dataSource: DataSource,
  eventId: string,
): Promise<Event | null> {
  return dataSource.getRepository(Event).findOne({
    where: { id: eventId, status: EventStatus.PUBLISHED },
    relations: { ticketLots: true },
  });
}
