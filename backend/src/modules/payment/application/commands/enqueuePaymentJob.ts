import type Redis from "ioredis";
import { PAYMENT_PROCESS_QUEUE_KEY } from "../../../../shared/infrastructure/config/constants";
import type { PaymentWebhookPayload } from "../types";

export type PaymentWebhookJob = {
  kind: "webhook";
  payload: PaymentWebhookPayload;
  attempt?: number;
};

export type MercadoPagoPaymentJob = {
  kind: "mercadopago";
  paymentId: string;
  attempt?: number;
};

export type PaymentProcessJob = PaymentWebhookJob | MercadoPagoPaymentJob;

const REPLAY_KEY_PREFIX = "webhook:dedupe:";
const QUEUE_DEDUPE_TTL_SECONDS = 15 * 60;

export function buildPaymentJobReplayKey(job: PaymentProcessJob): string {
  if (job.kind === "mercadopago") {
    return `${REPLAY_KEY_PREFIX}mercadopago:${job.paymentId}`;
  }

  const { event, data } = job.payload;
  return `${REPLAY_KEY_PREFIX}internal:${data.orderId}:${data.transactionId}:${event}`;
}

function buildQueueDedupeKey(job: PaymentProcessJob): string {
  if (job.kind === "mercadopago") {
    return `webhook:queued:mp:${job.paymentId}`;
  }

  const { event, data } = job.payload;
  return `webhook:queued:internal:${data.orderId}:${data.transactionId}:${event}`;
}

export type EnqueuePaymentJobResult = {
  enqueued: boolean;
};

/**
 * Enfileira job de pagamento com dedupe curto (evita rajadas de webhook).
 * O anti-replay definitivo é gravado só após processamento bem-sucedido.
 */
export async function enqueuePaymentJob(
  redis: Redis,
  job: PaymentProcessJob,
): Promise<EnqueuePaymentJobResult> {
  const dedupeKey = buildQueueDedupeKey(job);
  const inserted = await redis.set(
    dedupeKey,
    "1",
    "EX",
    QUEUE_DEDUPE_TTL_SECONDS,
    "NX",
  );

  if (inserted !== "OK") {
    return { enqueued: false };
  }

  const payload: PaymentProcessJob = { ...job, attempt: job.attempt ?? 1 };
  await redis.lpush(PAYMENT_PROCESS_QUEUE_KEY, JSON.stringify(payload));
  return { enqueued: true };
}

/** Libera o dedupe de fila (ex.: ao mover para DLQ) para permitir reprocessamento. */
export async function clearPaymentJobQueueDedupe(
  redis: Redis,
  job: PaymentProcessJob,
): Promise<void> {
  await redis.del(buildQueueDedupeKey(job));
}
