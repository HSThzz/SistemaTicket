/**
 * @file Query: busca evento publicado por ID com lotes.
 * @module modules/catalog/application/queries/findOnePublishedEventById
 */

import { IsNull } from "typeorm";
import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { EventStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOnePublishedEventById(
  eventId: string,
): Promise<Event | null> {
  return AppDataSource.getRepository(Event).findOne({
    where: {
      id: eventId,
      status: EventStatus.PUBLISHED,
      deletedAt: IsNull(),
    },
    relations: { ticketLots: true },
  });
}
