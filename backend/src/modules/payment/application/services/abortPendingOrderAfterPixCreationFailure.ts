import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import type { PaymentGateway } from "../../infrastructure/gateways/PaymentGateway";
import { createPaymentGateway } from "../../infrastructure/gateways/createPaymentGateway";
import { handlePaymentFailed } from "./handlePaymentFailed";

const CONTEXT = "PaymentService";
const logger = Logger.getInstance();

export async function abortPendingOrderAfterPixCreationFailure(
  dataSource: DataSource,
  redis: Redis | undefined,
  orderId: string,
  reason: string,
  _gateway: PaymentGateway = createPaymentGateway(),
): Promise<void> {
  logger.error(CONTEXT, "Aborting order after PIX creation failure", {
    orderId,
    reason,
  });

  await handlePaymentFailed(dataSource, redis, {
    orderId,
    transactionId: "pix_creation_failed",
    failureReason: reason,
  });
}
