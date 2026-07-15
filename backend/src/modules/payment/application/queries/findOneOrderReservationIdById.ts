/**
 * @file Query: busca reservationId de um pedido.
 * @module modules/payment/application/queries/findOneOrderReservationIdById
 */

import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneOrderReservationIdById(orderId: string,
): Promise<{ id: string; reservationId: string } | null> {
  return AppDataSource.getRepository(Order)
    .createQueryBuilder("order")
    .select(["order.id", "order.reservationId"])
    .where("order.id = :orderId", { orderId })
    .getOne();
}


