export type PaymentWebhookEventType = "payment.succeeded" | "payment.failed";

export interface PaymentWebhookPayload {
  event: PaymentWebhookEventType;
  data: {
    transactionId: string;
    orderId: string;
    paidAt?: string;
    failureReason?: string;
  };
}

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
