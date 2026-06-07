/**
 * @file Query: lista eventos publicados com lotes.
 * @module modules/catalog/application/queries/findPublishedEvents
 */

import type { DataSource } from "typeorm";
import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { EventStatus } from "../../../../shared/kernel/enums";

export async function findPublishedEvents(dataSource: DataSource): Promise<Event[]> {
  return dataSource.getRepository(Event).find({
    where: { status: EventStatus.PUBLISHED },
    order: { date: "ASC" },
    relations: { ticketLots: true },
  });
}
