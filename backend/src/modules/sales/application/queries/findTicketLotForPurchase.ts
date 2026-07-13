/**
 * @file Query: lote elegível para compra (evento publicado).
 * @module modules/sales/application/queries/findTicketLotForPurchase
 */

import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import { EventStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export type TicketLotForPurchase = {
  id: string;
  availableQuantity: number;
  eventId: string;
  eventStatus: EventStatus;
};

export async function findTicketLotForPurchase(
  ticketLotId: string,
): Promise<TicketLotForPurchase | null> {
  const row = await AppDataSource.getRepository(TicketLot)
    .createQueryBuilder("lot")
    .innerJoin("lot.event", "event")
    .select("lot.id", "id")
    .addSelect("lot.available_quantity", "availableQuantity")
    .addSelect("event.id", "eventId")
    .addSelect("event.status", "eventStatus")
    .where("lot.id = :ticketLotId", { ticketLotId })
    .andWhere("event.deleted_at IS NULL")
    .getRawOne<{
      id: string;
      availableQuantity: string | number;
      eventId: string;
      eventStatus: EventStatus;
    }>();

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    availableQuantity: Number(row.availableQuantity),
    eventId: row.eventId,
    eventStatus: row.eventStatus,
  };
}
