/**
 * @file Query: obtém id e tipo do evento a partir de um lote de ingressos.
 * @module modules/participation/application/queries/findEventVisibilityByTicketLotId
 */

import { TicketLot } from "../../../../shared/infrastructure/persistence/entities/TicketLot";
import type { EventType } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export interface EventVisibility {
  eventId: string;
  type: EventType;
}

export async function findEventVisibilityByTicketLotId(
  ticketLotId: string,
): Promise<EventVisibility | null> {
  const row = await AppDataSource.getRepository(TicketLot)
    .createQueryBuilder("lot")
    .innerJoin("lot.event", "event")
    .select("event.id", "eventId")
    .addSelect("event.type", "type")
    .where("lot.id = :ticketLotId", { ticketLotId })
    .getRawOne<{ eventId: string; type: EventType }>();

  return row ? { eventId: row.eventId, type: row.type } : null;
}
