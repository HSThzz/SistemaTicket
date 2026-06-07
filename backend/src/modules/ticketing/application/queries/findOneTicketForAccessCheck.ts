/**
 * @file Query: busca ingresso por ID para verificação de acesso à carteira.
 * @module modules/ticketing/application/queries/findOneTicketForAccessCheck
 */

import type { DataSource } from "typeorm";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";

export async function findOneTicketForAccessCheck(
  dataSource: DataSource,
  ticketId: string,
): Promise<Ticket | null> {
  return dataSource.getRepository(Ticket).findOne({
    where: { id: ticketId },
    relations: {
      order: true,
      ticketLot: { event: true },
    },
    select: {
      id: true,
      orderId: true,
      ticketLotId: true,
    },
  });
}
