/**
 * @file Query: soma receita de pedidos pagos por evento (líquida da taxa da plataforma).
 * @module modules/catalog/application/queries/sumRevenueByEventIds
 */

import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { OrderStatus } from "../../../../shared/kernel/enums";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

/**
 * Soma `totalPrice - platformFeeCents` por evento, um pedido por vez.
 *
 * Usa o caminho Order → Reservation → Lot → Event (1:1) para não multiplicar
 * a receita pela quantidade de ingressos do pedido. Não usar `SUM(DISTINCT …)`:
 * em Postgres isso deduplica pelo valor, não pelo pedido — pedidos do mesmo
 * preço eram contados só uma vez.
 */
export async function sumRevenueByEventIds(
  eventIds: string[],
): Promise<Map<string, number>> {
  if (eventIds.length === 0) {
    return new Map();
  }

  const rows = await AppDataSource.getRepository(Order)
    .createQueryBuilder("order")
    .innerJoin("order.reservation", "reservation")
    .innerJoin("reservation.ticketLot", "lot")
    .innerJoin("lot.event", "event")
    .select("event.id", "eventId")
    .addSelect(
      "COALESCE(SUM(order.totalPrice - order.platformFeeCents), 0)",
      "revenue",
    )
    .where("event.id IN (:...eventIds)", { eventIds })
    .andWhere("order.status = :status", { status: OrderStatus.PAID })
    .groupBy("event.id")
    .getRawMany<{ eventId: string; revenue: string }>();

  return new Map(rows.map((row) => [row.eventId, Number(row.revenue)]));
}
