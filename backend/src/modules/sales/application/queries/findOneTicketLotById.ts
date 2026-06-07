/**
 * @file Query: busca lote por ID com campos de estoque.
 * @module modules/sales/application/queries/findOneTicketLotById
 */

import type { DataSource } from "typeorm";
import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";

export async function findOneTicketLotById(
  dataSource: DataSource,
  ticketLotId: string,
): Promise<TicketLot | null> {
  return dataSource.getRepository(TicketLot).findOne({
    where: { id: ticketLotId },
    select: { id: true, availableQuantity: true },
  });
}
