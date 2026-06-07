/**
 * @file Query: busca ingresso por código único com lote e evento.
 * @module modules/ticketing/application/queries/findOneTicketByUniqueCode
 */

import type { DataSource } from "typeorm";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";

export async function findOneTicketByUniqueCode(
  dataSource: DataSource,
  uniqueCode: string,
): Promise<Ticket | null> {
  return dataSource.getRepository(Ticket).findOne({
    where: { uniqueCode },
    relations: { ticketLot: { event: true } },
  });
}
