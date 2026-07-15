/**
 * @file Query: lista eventos publicados com lotes.
 * @module modules/catalog/application/queries/findPublishedEvents
 */

import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { EventStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findPublishedEvents(): Promise<Event[]> {
  return AppDataSource.getRepository(Event)
    .createQueryBuilder("event")
    .leftJoinAndSelect("event.ticketLots", "ticketLots")
    .where("event.status = :status", { status: EventStatus.PUBLISHED })
    .andWhere("event.deletedAt IS NULL")
    .orderBy("event.date", "ASC")
    .getMany();
}
