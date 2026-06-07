import type { PaymentWebhookInputSchema } from "../validators/schema/paymentWebhookSchema";

export type { PaymentWebhookInputSchema };
export type PaymentWebhookPayload = PaymentWebhookInputSchema;
export type PaymentWebhookEventType = PaymentWebhookInputSchema["event"];

export interface PixPaymentDetails {
  orderId: string;
  transactionId: string;
  pixCopyPaste: string;
  expiresAt: string;
  amountCents: number;
}

export interface RefundOrderResult {
  orderId: string;
  ticketsCancelled: number;
  stockRestored: number;
}
