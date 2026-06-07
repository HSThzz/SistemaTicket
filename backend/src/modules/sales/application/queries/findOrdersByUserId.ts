/**
 * @file Query: lista pedidos de um usuário com relações.
 * @module modules/sales/application/queries/findOrdersByUserId
 */

import type { DataSource } from "typeorm";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";

export async function findOrdersByUserId(
  dataSource: DataSource,
  userId: string,
): Promise<Order[]> {
  return dataSource.getRepository(Order).find({
    where: { userId },
    relations: {
      reservation: {
        ticketLot: {
          event: true,
        },
      },
    },
    order: { id: "DESC" },
  });
}
