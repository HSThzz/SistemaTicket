/**
 * @file Query: lista pedidos de um usuário com relações.
 * @module modules/sales/application/queries/findOrdersByUserId
 */

import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOrdersByUserId(userId: string,
): Promise<Order[]> {
  return AppDataSource.getRepository(Order).find({
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


