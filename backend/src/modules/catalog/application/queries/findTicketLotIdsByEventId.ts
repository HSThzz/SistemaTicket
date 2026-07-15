/**
 * @file Query: IDs dos lotes de um evento.
 * @module modules/catalog/application/queries/findTicketLotIdsByEventId
 */

import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findTicketLotIdsByEventId(
  eventId: string,
): Promise<string[]> {
  const lots = await AppDataSource.getRepository(TicketLot)
    .createQueryBuilder("lot")
    .select(["lot.id"])
    .where("lot.eventId = :eventId", { eventId })
    .getMany();

  return lots.map((lot) => lot.id);
}
