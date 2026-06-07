import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import type { PaymentGateway } from "../../infrastructure/gateways/PaymentGateway";
import { createPaymentGateway } from "../../infrastructure/gateways/createPaymentGateway";
import { validateWebhookPayload } from "../helpers/validateWebhookPayload";
import type { PaymentWebhookPayload } from "../types";
import { handlePaymentFailed } from "./handlePaymentFailed";
import { handlePaymentSucceeded } from "./handlePaymentSucceeded";

const CONTEXT = "PaymentService";
const logger = Logger.getInstance();

export async function handleWebhook(
  dataSource: DataSource,
  redis: Redis | undefined,
  payload: PaymentWebhookPayload,
  _gateway: PaymentGateway = createPaymentGateway(),
): Promise<void> {
  validateWebhookPayload(payload);

  logger.info(CONTEXT, "Webhook received", {
    event: payload.event,
    orderId: payload.data.orderId,
    transactionId: payload.data.transactionId,
  });

  if (payload.event === "payment.succeeded") {
    await handlePaymentSucceeded(dataSource, redis, payload.data);
    return;
  }

  await handlePaymentFailed(dataSource, redis, payload.data);
}
