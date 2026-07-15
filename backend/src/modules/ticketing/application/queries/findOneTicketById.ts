/**
 * @file Query: busca ingresso por ID com pedido, usuário, lote e evento.
 * @module modules/ticketing/application/queries/findOneTicketById
 */

import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneTicketById(ticketId: string,
): Promise<Ticket | null> {
  return AppDataSource.getRepository(Ticket)
    .createQueryBuilder("ticket")
    .leftJoinAndSelect("ticket.order", "order")
    .leftJoinAndSelect("order.user", "user")
    .leftJoinAndSelect("ticket.ticketLot", "ticketLot")
    .leftJoinAndSelect("ticketLot.event", "event")
    .where("ticket.id = :ticketId", { ticketId })
    .getOne();
}


