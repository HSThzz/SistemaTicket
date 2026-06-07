/**
 * @file Query: busca pedido por ID.
 * @module modules/payment/application/queries/findOneOrderById
 */

import type { DataSource } from "typeorm";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";

export async function findOneOrderById(
  dataSource: DataSource,
  orderId: string,
): Promise<Order | null> {
  return dataSource.getRepository(Order).findOne({
    where: { id: orderId },
  });
}
