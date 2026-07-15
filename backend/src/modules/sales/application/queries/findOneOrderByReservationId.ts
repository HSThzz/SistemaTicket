/**
 * @file Query: busca pedido por ID da reserva.
 * @module modules/sales/application/queries/findOneOrderByReservationId
 */

import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneOrderByReservationId(reservationId: string,
): Promise<Order | null> {
  return AppDataSource.getRepository(Order)
    .createQueryBuilder("order")
    .where("order.reservationId = :reservationId", { reservationId })
    .getOne();
}


