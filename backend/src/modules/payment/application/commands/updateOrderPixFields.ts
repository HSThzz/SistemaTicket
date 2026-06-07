/**
 * @file Command: atualiza campos PIX de um pedido.
 * @module modules/payment/application/commands/updateOrderPixFields
 */

import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";

export interface UpdateOrderPixFieldsData {
  pixCopyPaste: string;
  pixExpiresAt: Date;
}

export async function updateOrderPixFields(orderId: string,
  data: UpdateOrderPixFieldsData,
): Promise<void> {
  await AppDataSource.getRepository(Order).update(orderId, {
    pixCopyPaste: data.pixCopyPaste,
    pixExpiresAt: data.pixExpiresAt,
  });
}


