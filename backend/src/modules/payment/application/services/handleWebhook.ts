import type Redis from "ioredis";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import type { PaymentGateway } from "../../infrastructure/gateways/PaymentGateway";
import { createPaymentGateway } from "../../infrastructure/gateways/createPaymentGateway";
import {
  paymentWebhookSchema,
  type PaymentWebhookInputSchema,
} from "../../validators/schema/paymentWebhookSchema";
import { handlePaymentFailed } from "./handlePaymentFailed";
import { handlePaymentSucceeded } from "./handlePaymentSucceeded";

const CONTEXT = "handleWebhook";
const logger = Logger.getInstance();

export async function handleWebhook(
  redis: Redis | undefined,
  payload: PaymentWebhookInputSchema,
  _gateway: PaymentGateway = createPaymentGateway(),
) {
  const data = validateSchema(paymentWebhookSchema, payload);

  logger.info(CONTEXT, "Webhook received", {
    event: data.event,
    orderId: data.data.orderId,
    transactionId: data.data.transactionId,
  });

  if (data.event === "payment.succeeded") {
    await handlePaymentSucceeded(redis, data.data);
    return;
  }

  await handlePaymentFailed(redis, data.data);
}
