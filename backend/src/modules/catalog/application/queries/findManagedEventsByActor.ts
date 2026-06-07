/**
 * @file Query: lista eventos gerenciáveis pelo ator (admin ou produtor).
 * @module modules/catalog/application/queries/findManagedEventsByActor
 */

import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { UserRole } from "../../../../shared/kernel/enums";
import type { EventActor } from "../types";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findManagedEventsByActor(actor: EventActor,
): Promise<Event[]> {
  const repository = AppDataSource.getRepository(Event);

  if (actor.role === UserRole.ADMIN) {
    return repository.find({
      order: { date: "ASC" },
      relations: { ticketLots: true },
    });
  }

  return repository.find({
    where: { producerId: actor.userId },
    order: { date: "ASC" },
    relations: { ticketLots: true },
  });
}


