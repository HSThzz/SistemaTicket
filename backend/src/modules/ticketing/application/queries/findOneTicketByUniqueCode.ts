/**
 * @file Query: busca ingresso por código único com lote e evento.
 * @module modules/ticketing/application/queries/findOneTicketByUniqueCode
 */

import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneTicketByUniqueCode(uniqueCode: string,
): Promise<Ticket | null> {
  return AppDataSource.getRepository(Ticket)
    .createQueryBuilder("ticket")
    .leftJoinAndSelect("ticket.ticketLot", "ticketLot")
    .leftJoinAndSelect("ticketLot.event", "event")
    .where("ticket.uniqueCode = :uniqueCode", { uniqueCode })
    .getOne();
}


