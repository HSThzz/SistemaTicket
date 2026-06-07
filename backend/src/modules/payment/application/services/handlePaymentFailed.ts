import type Redis from "ioredis";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { processPaymentFailed } from "../commands/processPaymentFailed";
import { clearPaymentCache } from "../helpers/clearPaymentCache";
import { clearReservationCache } from "../helpers/clearReservationCache";
import type { PaymentWebhookPayload } from "../types";

const CONTEXT = "PaymentService";
const logger = Logger.getInstance();

export async function handlePaymentFailed(
  redis: Redis | undefined,
  data: PaymentWebhookPayload["data"],
) {
  logger.warn(CONTEXT, "Processing payment failure", {
    orderId: data.orderId,
    transactionId: data.transactionId,
    failureReason: data.failureReason,
  });

  const result = await processPaymentFailed({
      orderId: data.orderId,
      transactionId: data.transactionId,
    },
    redis,
  );

  if (result.status === "already_failed") {
    logger.info(CONTEXT, "Payment failure ignored — order already failed", {
      orderId: data.orderId,
    });
    return;
  }

  if (result.status === "reservation_not_restored") {
    logger.info(CONTEXT, "Payment failed — reservation not restored", {
      orderId: data.orderId,
    });
  } else if (result.status === "processed") {
    logger.info(CONTEXT, "Payment failed — stock restored to lot", {
      orderId: data.orderId,
      ticketLotId: result.ticketLotId,
      quantityRestored: result.stockRestored,
    });
  }

  await clearReservationCache(redis, data.orderId);
  await clearPaymentCache(redis, data.orderId);
}
