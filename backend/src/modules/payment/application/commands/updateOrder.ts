/**
 * @file Command: persiste alterações em pedido existente.
 * @module modules/payment/application/commands/updateOrder
 */

import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export async function updateOrder(order: Order,
): Promise<Order> {
  return AppDataSource.getRepository(Order).save(order);
}


