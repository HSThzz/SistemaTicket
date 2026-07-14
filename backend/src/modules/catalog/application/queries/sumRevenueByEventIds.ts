/**
 * @file Query: soma receita bruta de pedidos pagos por evento.
 * @module modules/catalog/application/queries/sumRevenueByEventIds
 */

import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { OrderStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function sumRevenueByEventIds(eventIds: string[],
): Promise<Map<string, number>> {
  const rows = await AppDataSource
    .getRepository(Order)
    .createQueryBuilder("order")
    .innerJoin("order.tickets", "ticket")
    .innerJoin("ticket.ticketLot", "lot")
    .innerJoin("lot.event", "event")
    .select("event.id", "eventId")
    .addSelect(
      "SUM(DISTINCT (order.totalPrice - order.platformFeeCents))",
      "revenue",
    )
    .where("event.id IN (:...eventIds)", { eventIds })
    .andWhere("order.status = :status", { status: OrderStatus.PAID })
    .groupBy("event.id")
    .getRawMany<{ eventId: string; revenue: string }>();

  return new Map(rows.map((row) => [row.eventId, Number(row.revenue)]));
}

