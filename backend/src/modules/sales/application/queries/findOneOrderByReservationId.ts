/**
 * @file Query: busca pedido por ID da reserva.
 * @module modules/sales/application/queries/findOneOrderByReservationId
 */

import type { DataSource } from "typeorm";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";

export async function findOneOrderByReservationId(
  dataSource: DataSource,
  reservationId: string,
): Promise<Order | null> {
  return dataSource.getRepository(Order).findOne({
    where: { reservationId },
  });
}
