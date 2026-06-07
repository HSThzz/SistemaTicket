import type { DataSource } from "typeorm";
import { updateOrderPixFields } from "../commands/updateOrderPixFields";
import type { PixPaymentDetails } from "../types";

export async function persistPixOnOrder(
  dataSource: DataSource,
  orderId: string,
  details: PixPaymentDetails,
): Promise<void> {
  await updateOrderPixFields(dataSource, orderId, {
    pixCopyPaste: details.pixCopyPaste,
    pixExpiresAt: new Date(details.expiresAt),
  });
}
