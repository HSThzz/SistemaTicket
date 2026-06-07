import type Redis from "ioredis";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import type { PaymentGateway } from "../../infrastructure/gateways/PaymentGateway";
import { createPaymentGateway } from "../../infrastructure/gateways/createPaymentGateway";
import { handlePaymentFailed } from "./handlePaymentFailed";

const CONTEXT = "PaymentService";
const logger = Logger.getInstance();

export async function abortPendingOrderAfterPixCreationFailure(
  redis: Redis | undefined,
  orderId: string,
  reason: string,
  _gateway: PaymentGateway = createPaymentGateway(),
) {
  logger.error(CONTEXT, "Aborting order after PIX creation failure", {
    orderId,
    reason,
  });

  await handlePaymentFailed(redis, {
    orderId,
    transactionId: "pix_creation_failed",
    failureReason: reason,
  });
}
