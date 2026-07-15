/**
 * @file Query: conta ingressos emitidos de um lote.
 * @module modules/catalog/application/queries/countTicketsByLotId
 */

import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function countTicketsByLotId(lotId: string): Promise<number> {
  return AppDataSource.getRepository(Ticket)
    .createQueryBuilder("ticket")
    .where("ticket.ticketLotId = :lotId", { lotId })
    .getCount();
}
