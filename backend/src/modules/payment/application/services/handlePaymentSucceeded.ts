import type Redis from "ioredis";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { enqueueTicketDelivery } from "../../../notifications/application/commands/enqueueTicketDelivery";
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
    const result = await processPaymentSucceeded(
      {
        id: data.orderId,
        paymentGatewayId: data.transactionId,
      },
      redis,
    );

    logger.info(CONTEXT, "Payment succeeded — tickets issued", {
      orderId: result.id,
      reservationId: result.reservationId,
      transactionId: result.paymentGatewayId,
      ticketsCreated: result.ticketsCreated,
      ticketIds: result.ticketIds,
      recoveredFromExpired: result.recoveredFromExpired,
    });

    if (result.ticketsCreated > 0 || result.ticketIds.length > 0) {
      await enqueueTicketDelivery(result);
    }
  } catch (error) {
    if (error instanceof PaymentAlreadyProcessedError) {
      logger.warn(CONTEXT, "Payment success ignored — already processed", {
        orderId: data.orderId,
      });
      // Re-tenta enfileirar entrega caso o enqueue anterior tenha falhado.
      await enqueueTicketDelivery({ id: data.orderId });
      await clearReservationCache(redis, data.orderId);
      await clearPaymentCache(redis, data.orderId);
      return;
    }
    throw error;
  }

  await clearReservationCache(redis, data.orderId);
  await clearPaymentCache(redis, data.orderId);
}
