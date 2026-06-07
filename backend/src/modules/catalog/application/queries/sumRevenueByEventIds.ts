/**
 * @file Query: soma receita bruta de pedidos pagos por evento.
 * @module modules/catalog/application/queries/sumRevenueByEventIds
 */

import type { DataSource } from "typeorm";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { OrderStatus } from "../../../../shared/kernel/enums";

export async function sumRevenueByEventIds(
  dataSource: DataSource,
  eventIds: string[],
): Promise<Map<string, number>> {
  const rows = await dataSource
    .getRepository(Order)
    .createQueryBuilder("order")
    .innerJoin("order.tickets", "ticket")
    .innerJoin("ticket.ticketLot", "lot")
    .innerJoin("lot.event", "event")
    .select("event.id", "eventId")
    .addSelect("SUM(DISTINCT order.totalPrice)", "revenue")
    .where("event.id IN (:...eventIds)", { eventIds })
    .andWhere("order.status = :status", { status: OrderStatus.PAID })
    .groupBy("event.id")
    .getRawMany<{ eventId: string; revenue: string }>();

  return new Map(rows.map((row) => [row.eventId, Number(row.revenue)]));
}
