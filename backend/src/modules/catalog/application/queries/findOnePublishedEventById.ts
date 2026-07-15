/**
 * @file Query: busca evento publicado por ID ou slug com lotes.
 * @module modules/catalog/application/queries/findOnePublishedEventById
 */

import { IsNull } from "typeorm";
import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { EventStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { uuidSchema } from "../../../../shared/kernel/zodFields";

export async function findOnePublishedEventById(
  eventIdOrSlug: string,
): Promise<Event | null> {
  const repository = AppDataSource.getRepository(Event);
  const isUuid = uuidSchema.safeParse(eventIdOrSlug).success;

  return repository.findOne({
    where: {
      ...(isUuid ? { id: eventIdOrSlug } : { slug: eventIdOrSlug }),
      status: EventStatus.PUBLISHED,
      deletedAt: IsNull(),
    },
    relations: { ticketLots: true },
  });
}
