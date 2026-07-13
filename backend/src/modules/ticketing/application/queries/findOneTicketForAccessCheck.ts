/**
 * @file Query: busca ingresso por ID para verificação de acesso à carteira.
 * @module modules/ticketing/application/queries/findOneTicketForAccessCheck
 */

import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneTicketForAccessCheck(
  ticketId: string,
): Promise<Ticket | null> {
  return AppDataSource.getRepository(Ticket).findOne({
    where: { id: ticketId },
    relations: {
      order: true,
      ticketLot: { event: true },
    },
    select: {
      id: true,
      status: true,
      orderId: true,
      ticketLotId: true,
      order: {
        id: true,
        userId: true,
      },
      ticketLot: {
        id: true,
        eventId: true,
        event: {
          id: true,
          producerId: true,
        },
      },
    },
  });
}
