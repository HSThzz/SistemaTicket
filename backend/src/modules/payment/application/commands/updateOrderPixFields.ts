/**
 * @file Command: atualiza campos PIX de um pedido.
 * @module modules/payment/application/commands/updateOrderPixFields
 */

import type { DataSource } from "typeorm";
import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";

export interface UpdateOrderPixFieldsData {
  pixCopyPaste: string;
  pixExpiresAt: Date;
}

export async function updateOrderPixFields(
  dataSource: DataSource,
  orderId: string,
  data: UpdateOrderPixFieldsData,
): Promise<void> {
  await dataSource.getRepository(Order).update(orderId, {
    pixCopyPaste: data.pixCopyPaste,
    pixExpiresAt: data.pixExpiresAt,
  });
}
