import { updateOrderPixFields } from "../commands/updateOrderPixFields";
import type { PixPaymentDetails } from "../types";

export async function persistPixOnOrder(
  orderId: string,
  details: PixPaymentDetails,
): Promise<void> {
  await updateOrderPixFields(orderId, {
    pixCopyPaste: details.pixCopyPaste,
    pixExpiresAt: new Date(details.expiresAt),
  });
}
