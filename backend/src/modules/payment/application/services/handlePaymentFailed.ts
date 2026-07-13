import type Redis from "ioredis";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import type { PaymentWebhookPayload } from "../types";

const CONTEXT = "PaymentService";
const logger = Logger.getInstance();

/**
 * Registra falha/rejeição do gateway sem encerrar o pedido.
 * Mantém a reserva `PENDING` para nova tentativa até o TTL (mesmo comportamento
 * do cartão rejeitado de forma síncrona).
 */
export async function handlePaymentFailed(
  _redis: Redis | undefined,
  data: PaymentWebhookPayload["data"],
) {
  logger.warn(CONTEXT, "Payment failure noted — order kept pending until reservation TTL", {
    orderId: data.orderId,
    transactionId: data.transactionId,
    failureReason: data.failureReason,
  });
}
