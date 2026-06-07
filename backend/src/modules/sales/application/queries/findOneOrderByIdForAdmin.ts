/**
 * @file Query: busca pedido por ID com usuário, reserva e evento.
 * @module modules/sales/application/queries/findOneOrderByIdForAdmin
 */

import type { DataSource } from "typeorm";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";

export async function findOneOrderByIdForAdmin(
  dataSource: DataSource,
  orderId: string,
): Promise<Order | null> {
  return dataSource.getRepository(Order).findOne({
    where: { id: orderId },
    relations: {
      user: true,
      reservation: {
        ticketLot: {
          event: true,
        },
      },
    },
  });
}
