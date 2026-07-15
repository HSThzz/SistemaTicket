/**
 * @file Query: lista todos os lotes com dados de estoque.
 * @module modules/sales/application/queries/findAllTicketLotsStock
 */

import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findAllTicketLotsStock(): Promise<TicketLot[]> {
  return AppDataSource.getRepository(TicketLot)
    .createQueryBuilder("ticketLot")
    .select(["ticketLot.id", "ticketLot.availableQuantity", "ticketLot.totalQuantity"])
    .getMany();
}


