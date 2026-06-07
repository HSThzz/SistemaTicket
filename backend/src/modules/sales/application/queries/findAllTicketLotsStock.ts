/**
 * @file Query: lista todos os lotes com dados de estoque.
 * @module modules/sales/application/queries/findAllTicketLotsStock
 */

import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findAllTicketLotsStock(): Promise<TicketLot[]> {
  return AppDataSource.getRepository(TicketLot).find({
    select: { id: true, availableQuantity: true, totalQuantity: true },
  });
}


