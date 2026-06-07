/**
 * @file Query: lista ingressos de um usuário com relações.
 * @module modules/ticketing/application/queries/findTicketsByUserId
 */

import type { DataSource } from "typeorm";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";

export async function findTicketsByUserId(
  dataSource: DataSource,
  userId: string,
): Promise<Ticket[]> {
  return dataSource.getRepository(Ticket).find({
    where: { order: { userId } },
    relations: {
      order: true,
      ticketLot: { event: true },
    },
    order: { id: "DESC" },
  });
}
