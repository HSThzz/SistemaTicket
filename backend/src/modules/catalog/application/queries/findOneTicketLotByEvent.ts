/**
 * @file Query: busca lote por ID e evento.
 * @module modules/catalog/application/queries/findOneTicketLotByEvent
 */

import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneTicketLotByEvent(
  eventId: string,
  lotId: string,
): Promise<TicketLot | null> {
  return AppDataSource.getRepository(TicketLot)
    .createQueryBuilder("lot")
    .where("lot.id = :lotId", { lotId })
    .andWhere("lot.eventId = :eventId", { eventId })
    .getOne();
}
