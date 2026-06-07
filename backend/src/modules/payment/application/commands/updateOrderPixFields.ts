/**
 * @file Command: atualiza campos PIX de um pedido.
 * @module modules/payment/application/commands/updateOrderPixFields
 */

import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import type { Prettify } from "../../../../shared/kernel/prettify";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export type UpdateOrderPixFieldsData = Prettify<
  Pick<Order, "pixCopyPaste" | "pixExpiresAt"> & {
    pixCopyPaste: NonNullable<Order["pixCopyPaste"]>;
    pixExpiresAt: NonNullable<Order["pixExpiresAt"]>;
  }
>;

export async function updateOrderPixFields(orderId: string,
  data: UpdateOrderPixFieldsData,
): Promise<void> {
  await AppDataSource.getRepository(Order).update(orderId, {
    pixCopyPaste: data.pixCopyPaste,
    pixExpiresAt: data.pixExpiresAt,
  });
}
