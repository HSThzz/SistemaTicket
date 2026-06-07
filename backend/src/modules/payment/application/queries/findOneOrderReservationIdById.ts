/**
 * @file Query: busca reservationId de um pedido.
 * @module modules/payment/application/queries/findOneOrderReservationIdById
 */

import type { DataSource } from "typeorm";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";

export async function findOneOrderReservationIdById(
  dataSource: DataSource,
  orderId: string,
): Promise<{ id: string; reservationId: string } | null> {
  return dataSource.getRepository(Order).findOne({
    where: { id: orderId },
    select: { id: true, reservationId: true },
  });
}
