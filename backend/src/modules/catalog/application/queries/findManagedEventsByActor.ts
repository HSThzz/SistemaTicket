/**
 * @file Query: lista eventos gerenciáveis pelo ator (admin ou produtor).
 * @module modules/catalog/application/queries/findManagedEventsByActor
 */

import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { isStaffRole } from "../../../../shared/kernel/staffRoles";
import type { EventActor } from "../types";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findManagedEventsByActor(actor: EventActor,
): Promise<Event[]> {
  const repository = AppDataSource.getRepository(Event);

  if (isStaffRole(actor.role)) {
    return repository
      .createQueryBuilder("event")
      .leftJoinAndSelect("event.ticketLots", "ticketLots")
      .where("event.deletedAt IS NULL")
      .orderBy("event.date", "ASC")
      .getMany();
  }

  return repository
    .createQueryBuilder("event")
    .leftJoinAndSelect("event.ticketLots", "ticketLots")
    .where("event.producerId = :producerId", { producerId: actor.userId })
    .andWhere("event.deletedAt IS NULL")
    .orderBy("event.date", "ASC")
    .getMany();
}


