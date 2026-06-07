/**
 * @file Query: busca ingresso por ID com pedido, usuário, lote e evento.
 * @module modules/ticketing/application/queries/findOneTicketById
 */

import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneTicketById(ticketId: string,
): Promise<Ticket | null> {
  return AppDataSource.getRepository(Ticket).findOne({
    where: { id: ticketId },
    relations: {
      order: { user: true },
      ticketLot: { event: true },
    },
  });
}


