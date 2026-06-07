/**
 * @file Query: lista ingressos de um usuário com relações.
 * @module modules/ticketing/application/queries/findTicketsByUserId
 */

import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findTicketsByUserId(userId: string,
): Promise<Ticket[]> {
  return AppDataSource.getRepository(Ticket).find({
    where: { order: { userId } },
    relations: {
      order: true,
      ticketLot: { event: true },
    },
    order: { id: "DESC" },
  });
}


