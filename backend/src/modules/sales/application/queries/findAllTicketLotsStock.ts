/**
 * @file Query: lista todos os lotes com dados de estoque.
 * @module modules/sales/application/queries/findAllTicketLotsStock
 */

import type { DataSource } from "typeorm";
import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";

export async function findAllTicketLotsStock(
  dataSource: DataSource,
): Promise<TicketLot[]> {
  return dataSource.getRepository(TicketLot).find({
    select: { id: true, availableQuantity: true, totalQuantity: true },
  });
}
