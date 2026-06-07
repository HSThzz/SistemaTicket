import type Redis from "ioredis";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { InvalidWebhookPayloadError } from "../../domain/errors/PaymentError";
import type { PaymentGateway } from "../../infrastructure/gateways/PaymentGateway";
import {
  createPaymentGateway,
  isMercadoPagoPixGateway,
} from "../../infrastructure/gateways/createPaymentGateway";
import { handleWebhook } from "./handleWebhook";

const CONTEXT = "PaymentService";
const logger = Logger.getInstance();

export async function handleMercadoPagoNotification(
  redis: Redis | undefined,
  paymentId: string,
  gateway: PaymentGateway = createPaymentGateway(),
) {
  if (!isMercadoPagoPixGateway(gateway)) {
    throw new InvalidWebhookPayloadError("Mercado Pago gateway is not configured");
  }

  const snapshot = await gateway.getPayment(paymentId);

  logger.info(CONTEXT, "Mercado Pago payment fetched", {
    paymentId,
    orderId: snapshot.orderId,
    status: snapshot.status,
  });

  if (snapshot.status === "pending") {
    return "pending";
  }

  if (snapshot.status === "approved") {
    await handleWebhook(redis,
      {
        event: "payment.succeeded",
        data: {
          orderId: snapshot.orderId,
          transactionId: snapshot.transactionId,
          paidAt: new Date().toISOString(),
        },
      },
      gateway,
    );
    return "processed";
  }

  if (
    snapshot.status === "rejected" ||
    snapshot.status === "cancelled" ||
    snapshot.status === "failed"
  ) {
    await handleWebhook(redis,
      {
        event: "payment.failed",
        data: {
          orderId: snapshot.orderId,
          transactionId: snapshot.transactionId,
          failureReason: snapshot.failureReason ?? snapshot.status,
        },
      },
      gateway,
    );
    return "processed";
  }

  return "ignored";
}
