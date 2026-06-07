import type { PaymentWebhookInputSchema } from "../validators/schema/paymentWebhookSchema";
import type { RefundOrderResult } from "./commands/refundOrder";

export type { PaymentWebhookInputSchema };
export type PaymentWebhookPayload = PaymentWebhookInputSchema;
export type PaymentWebhookEventType = PaymentWebhookInputSchema["event"];
export type { RefundOrderResult };

export interface PixPaymentDetails {
  orderId: string;
  transactionId: string;
  pixCopyPaste: string;
  expiresAt: string;
  amountCents: number;
}
