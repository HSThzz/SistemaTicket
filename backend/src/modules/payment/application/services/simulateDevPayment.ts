import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import { env, isProduction } from "../../../../shared/infrastructure/config/env";
import { OrderStatus } from "../../../../shared/kernel/enums";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import {
  InvalidWebhookPayloadError,
  OrderNotFoundError,
  PaymentAlreadyProcessedError,
} from "../../domain/errors/PaymentError";
import type { PaymentGateway } from "../../infrastructure/gateways/PaymentGateway";
import { createPaymentGateway } from "../../infrastructure/gateways/createPaymentGateway";
import { simulateDevPaymentSchema } from "../../validators/schema/simulateDevPaymentSchema";
import { findOneOrderById } from "../queries/findOneOrderById";
import { handleWebhook } from "./handleWebhook";

export async function simulateDevPayment(
  dataSource: DataSource,
  redis: Redis | undefined,
  orderId: string,
  requesterUserId: string,
  gateway: PaymentGateway = createPaymentGateway(),
): Promise<void> {
  const data = validateSchema(simulateDevPaymentSchema, { orderId, requesterUserId });

  if (isProduction) {
    throw new InvalidWebhookPayloadError("Dev payment simulation is disabled in production");
  }

  if (env.payment.gateway !== "simulated") {
    throw new InvalidWebhookPayloadError(
      "Dev payment simulation requires PAYMENT_GATEWAY=simulated",
    );
  }

  const order = await findOneOrderById(dataSource, data.orderId);

  if (!order) {
    throw new OrderNotFoundError(data.orderId);
  }

  if (order.userId !== data.requesterUserId) {
    throw new OrderNotFoundError(data.orderId);
  }

  if (order.status !== OrderStatus.PENDING) {
    throw new PaymentAlreadyProcessedError(data.orderId, order.status);
  }

  await handleWebhook(
    dataSource,
    redis,
    {
      event: "payment.succeeded",
      data: {
        orderId: order.id,
        transactionId: order.paymentGatewayId ?? `pix_sim_dev_${order.id}`,
        paidAt: new Date().toISOString(),
      },
    },
    gateway,
  );
}
