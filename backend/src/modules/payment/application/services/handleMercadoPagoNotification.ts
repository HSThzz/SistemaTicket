import type Redis from "ioredis";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { findOneOrderById } from "../queries/findOneOrderById";
import {
  InvalidWebhookPayloadError,
  PaymentAmountMismatchError,
} from "../../domain/errors/PaymentError";
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
    amountCents: snapshot.amountCents,
  });

  if (snapshot.amountCents !== undefined) {
    const order = await findOneOrderById(snapshot.orderId);

    if (order && order.totalPrice !== snapshot.amountCents) {
      logger.error(CONTEXT, "Payment amount mismatch — ignoring notification", {
        orderId: snapshot.orderId,
        expectedCents: order.totalPrice,
        gatewayCents: snapshot.amountCents,
        paymentId,
      });
      throw new PaymentAmountMismatchError(
        snapshot.orderId,
        order.totalPrice,
        snapshot.amountCents,
      );
    }
  }

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

  if (snapshot.status === "refunded") {
    await handleWebhook(redis,
      {
        event: "payment.refunded",
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
