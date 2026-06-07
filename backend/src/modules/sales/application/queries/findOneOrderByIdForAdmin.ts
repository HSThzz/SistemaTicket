/**
 * @file Query: busca pedido por ID com usuário, reserva e evento.
 * @module modules/sales/application/queries/findOneOrderByIdForAdmin
 */

import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneOrderByIdForAdmin(orderId: string,
): Promise<Order | null> {
  return AppDataSource.getRepository(Order).findOne({
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


