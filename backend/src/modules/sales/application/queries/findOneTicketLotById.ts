/**
 * @file Query: busca lote por ID com campos de estoque.
 * @module modules/sales/application/queries/findOneTicketLotById
 */

import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneTicketLotById(ticketLotId: string,
): Promise<TicketLot | null> {
  return AppDataSource.getRepository(TicketLot)
    .createQueryBuilder("ticketLot")
    .select(["ticketLot.id", "ticketLot.availableQuantity"])
    .where("ticketLot.id = :ticketLotId", { ticketLotId })
    .getOne();
}


