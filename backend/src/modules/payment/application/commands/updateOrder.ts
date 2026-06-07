/**
 * @file Command: persiste alterações em pedido existente.
 * @module modules/payment/application/commands/updateOrder
 */

import type { DataSource } from "typeorm";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";

export async function updateOrder(
  dataSource: DataSource,
  order: Order,
): Promise<Order> {
  return dataSource.getRepository(Order).save(order);
}
