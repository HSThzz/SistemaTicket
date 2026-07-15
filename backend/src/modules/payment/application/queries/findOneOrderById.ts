/**
 * @file Query: busca pedido por ID.
 * @module modules/payment/application/queries/findOneOrderById
 */

import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function findOneOrderById(orderId: string,
): Promise<Order | null> {
  return AppDataSource.getRepository(Order)
    .createQueryBuilder("order")
    .where("order.id = :orderId", { orderId })
    .getOne();
}


