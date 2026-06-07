/**
 * @file Query: busca lote por ID com campos de estoque.
 * @module modules/sales/application/queries/findOneTicketLotById
 */

import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneTicketLotById(ticketLotId: string,
): Promise<TicketLot | null> {
  return AppDataSource.getRepository(TicketLot).findOne({
    where: { id: ticketLotId },
    select: { id: true, availableQuantity: true },
  });
}


