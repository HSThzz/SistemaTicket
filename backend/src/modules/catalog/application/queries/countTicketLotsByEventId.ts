/**
 * @file Query: conta lotes de um evento.
 * @module modules/catalog/application/queries/countTicketLotsByEventId
 */

import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function countTicketLotsByEventId(eventId: string): Promise<number> {
  return AppDataSource.getRepository(TicketLot)
    .createQueryBuilder("lot")
    .where("lot.eventId = :eventId", { eventId })
    .getCount();
}
