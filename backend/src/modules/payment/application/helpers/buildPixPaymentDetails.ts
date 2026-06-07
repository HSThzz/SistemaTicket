import type { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import type { PixChargeResult } from "../../infrastructure/gateways/PaymentGateway";
import type { PixPaymentDetails } from "../types";

export function buildPixPaymentDetails(
  order: Order,
  charge: Pick<PixChargeResult, "transactionId" | "pixCopyPaste" | "expiresAt">,
): PixPaymentDetails {
  const expiresAt =
    charge.expiresAt instanceof Date
      ? charge.expiresAt.toISOString()
      : new Date(charge.expiresAt).toISOString();

  return {
    orderId: order.id,
    transactionId: charge.transactionId,
    pixCopyPaste: charge.pixCopyPaste,
    expiresAt,
    amountCents: order.totalPrice,
  };
}
