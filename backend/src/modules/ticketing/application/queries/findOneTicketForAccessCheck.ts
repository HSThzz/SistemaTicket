/**
 * @file Query: busca ingresso por ID para verificação de acesso à carteira.
 * @module modules/ticketing/application/queries/findOneTicketForAccessCheck
 */

import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneTicketForAccessCheck(
  ticketId: string,
): Promise<Ticket | null> {
  return AppDataSource.getRepository(Ticket)
    .createQueryBuilder("ticket")
    .leftJoin("ticket.order", "order")
    .leftJoin("ticket.ticketLot", "ticketLot")
    .leftJoin("ticketLot.event", "event")
    .select([
      "ticket.id",
      "ticket.status",
      "ticket.orderId",
      "ticket.ticketLotId",
      "order.id",
      "order.userId",
      "ticketLot.id",
      "ticketLot.eventId",
      "event.id",
      "event.producerId",
    ])
    .where("ticket.id = :ticketId", { ticketId })
    .getOne();
}
