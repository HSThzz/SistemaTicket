/**
 * @file Command: persiste alterações em pedido existente.
 * @module modules/payment/application/commands/updateOrder
 */

import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import type { Prettify } from "../../../../shared/kernel/prettify";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export type UpdateOrderData = Prettify<
  Partial<
    Pick<
      Order,
      "status" | "paymentGatewayId" | "pixCopyPaste" | "pixExpiresAt" | "totalPrice"
    >
  >
>;

export async function updateOrder(
  order: Order,
  changes?: UpdateOrderData,
): Promise<Order> {
  if (changes) {
    Object.assign(order, changes);
  }

  return AppDataSource.getRepository(Order).save(order);
}
