/**
 * @file Query: lista eventos gerenciáveis pelo ator (admin ou produtor).
 * @module modules/catalog/application/queries/findManagedEventsByActor
 */

import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { isStaffRole } from "../../../../shared/kernel/staffRoles";
import type { EventActor } from "../types";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { IsNull } from "typeorm";

export async function findManagedEventsByActor(actor: EventActor,
): Promise<Event[]> {
  const repository = AppDataSource.getRepository(Event);

  if (isStaffRole(actor.role)) {
    return repository.find({
      where: { deletedAt: IsNull() },
      order: { date: "ASC" },
      relations: { ticketLots: true },
    });
  }

  return repository.find({
    where: { producerId: actor.userId, deletedAt: IsNull() },
    order: { date: "ASC" },
    relations: { ticketLots: true },
  });
}


