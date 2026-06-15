import type Redis from "ioredis";
import { PAYMENT_PROCESS_QUEUE_KEY } from "../../../../shared/infrastructure/config/constants";
import type { PaymentWebhookPayload } from "../types";

export type PaymentWebhookJob = {
  kind: "webhook";
  payload: PaymentWebhookPayload;
};

export type MercadoPagoPaymentJob = {
  kind: "mercadopago";
  paymentId: string;
};

export type PaymentProcessJob = PaymentWebhookJob | MercadoPagoPaymentJob;

export async function enqueuePaymentJob(
  redis: Redis,
  job: PaymentProcessJob,
): Promise<void> {
  await redis.lpush(PAYMENT_PROCESS_QUEUE_KEY, JSON.stringify(job));
}
