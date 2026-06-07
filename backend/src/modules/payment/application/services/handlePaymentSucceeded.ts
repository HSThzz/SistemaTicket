import type Redis from "ioredis";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { PaymentAlreadyProcessedError } from "../../domain/errors/PaymentError";
import { processPaymentSucceeded } from "../commands/processPaymentSucceeded";
import { clearPaymentCache } from "../helpers/clearPaymentCache";
import { clearReservationCache } from "../helpers/clearReservationCache";
import type { PaymentWebhookPayload } from "../types";

const CONTEXT = "PaymentService";
const logger = Logger.getInstance();

export async function handlePaymentSucceeded(
  redis: Redis | undefined,
  data: PaymentWebhookPayload["data"],
) {
  logger.info(CONTEXT, "Processing payment success", {
    orderId: data.orderId,
    transactionId: data.transactionId,
  });

  try {
    const result = await processPaymentSucceeded({
      id: data.orderId,
      paymentGatewayId: data.transactionId,
    });

    logger.info(CONTEXT, "Payment succeeded — tickets issued", {
      orderId: result.id,
      reservationId: result.reservationId,
      transactionId: result.paymentGatewayId,
      ticketsCreated: result.ticketsCreated,
      ticketIds: result.ticketIds,
    });
  } catch (error) {
    if (error instanceof PaymentAlreadyProcessedError) {
      logger.warn(CONTEXT, "Payment success ignored — already processed", {
        orderId: data.orderId,
      });
    }
    throw error;
  }

  await clearReservationCache(redis, data.orderId);
  await clearPaymentCache(redis, data.orderId);
}
