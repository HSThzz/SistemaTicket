/**
 * @file Query: lista eventos gerenciáveis pelo ator (admin ou produtor).
 * @module modules/catalog/application/queries/findManagedEventsByActor
 */

import type { DataSource } from "typeorm";
import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { UserRole } from "../../../../shared/kernel/enums";
import type { EventActor } from "../types";

export async function findManagedEventsByActor(
  dataSource: DataSource,
  actor: EventActor,
): Promise<Event[]> {
  const repository = dataSource.getRepository(Event);

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
