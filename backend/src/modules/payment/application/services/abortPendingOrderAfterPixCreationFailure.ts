import type Redis from "ioredis";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { processPaymentFailed } from "../commands/processPaymentFailed";
import { clearPaymentCache } from "../helpers/clearPaymentCache";
import { clearReservationCache } from "../helpers/clearReservationCache";

const CONTEXT = "PaymentService";
const logger = Logger.getInstance();

/**
 * Encerra pedido e devolve estoque quando a criação da cobrança PIX falha de forma irrecuperável.
 */
export async function abortPendingOrderAfterPixCreationFailure(
  redis: Redis | undefined,
  orderId: string,
  reason: string,
) {
  logger.error(CONTEXT, "Aborting order after PIX creation failure", {
    orderId,
    reason,
  });

  const result = await processPaymentFailed(
    {
      id: orderId,
      paymentGatewayId: "pix_creation_failed",
    },
    redis,
  );

  logger.info(CONTEXT, "Order aborted after PIX creation failure", {
    orderId,
    result,
  });

  await clearReservationCache(redis, orderId);
  await clearPaymentCache(redis, orderId);
}
