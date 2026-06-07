/**
 * @file Query: conta ingressos por evento conforme status de pedido e ticket.
 * @module modules/catalog/application/queries/countTicketsByEventIds
 */

import type { DataSource } from "typeorm";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import type { OrderStatus, TicketStatus } from "../../../../shared/kernel/enums";

export async function countTicketsByEventIds(
  dataSource: DataSource,
  eventIds: string[],
  orderStatus: OrderStatus,
  ticketStatus?: TicketStatus,
): Promise<Map<string, number>> {
  const qb = dataSource
    .getRepository(Ticket)
    .createQueryBuilder("ticket")
    .innerJoin("ticket.order", "order")
    .innerJoin("ticket.ticketLot", "lot")
    .innerJoin("lot.event", "event")
    .select("event.id", "eventId")
    .addSelect("COUNT(ticket.id)", "count")
    .where("event.id IN (:...eventIds)", { eventIds })
    .andWhere("order.status = :orderStatus", { orderStatus })
    .groupBy("event.id");

  if (ticketStatus) {
    qb.andWhere("ticket.status = :ticketStatus", { ticketStatus });
  }

  const rows = await qb.getRawMany<{ eventId: string; count: string }>();
  return new Map(rows.map((row) => [row.eventId, Number(row.count)]));
}
