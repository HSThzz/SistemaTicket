/**
 * @file Query: busca evento publicado por ID ou slug com lotes.
 * @module modules/catalog/application/queries/findOnePublishedEventById
 */

import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { EventStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { uuidSchema } from "../../../../shared/kernel/zodFields";

export async function findOnePublishedEventById(
  eventIdOrSlug: string,
): Promise<Event | null> {
  const repository = AppDataSource.getRepository(Event);
  const isUuid = uuidSchema.safeParse(eventIdOrSlug).success;

  const qb = repository
    .createQueryBuilder("event")
    .leftJoinAndSelect("event.ticketLots", "ticketLots")
    .where(
      isUuid ? "event.id = :eventIdOrSlug" : "event.slug = :eventIdOrSlug",
      { eventIdOrSlug },
    )
    .andWhere("event.status = :status", { status: EventStatus.PUBLISHED })
    .andWhere("event.deletedAt IS NULL");

  return qb.getOne();
}
