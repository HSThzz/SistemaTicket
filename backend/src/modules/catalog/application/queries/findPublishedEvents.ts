/**
 * @file Query: lista eventos publicados com lotes.
 * @module modules/catalog/application/queries/findPublishedEvents
 */

import { IsNull } from "typeorm";
import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { EventStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findPublishedEvents(): Promise<Event[]> {
  return AppDataSource.getRepository(Event).find({
    where: { status: EventStatus.PUBLISHED, deletedAt: IsNull() },
    order: { date: "ASC" },
    relations: { ticketLots: true },
  });
}
