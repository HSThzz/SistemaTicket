/**
 * @file Query: busca ingresso por ID com pedido, usuário, lote e evento.
 * @module modules/ticketing/application/queries/findOneTicketById
 */

import type { DataSource } from "typeorm";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";

export async function findOneTicketById(
  dataSource: DataSource,
  ticketId: string,
): Promise<Ticket | null> {
  return dataSource.getRepository(Ticket).findOne({
    where: { id: ticketId },
    relations: {
      order: { user: true },
      ticketLot: { event: true },
    },
  });
}
