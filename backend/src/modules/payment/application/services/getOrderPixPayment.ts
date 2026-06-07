import type Redis from "ioredis";
import {
  OrderNotFoundError,
  PaymentGatewayError,
} from "../../domain/errors/PaymentError";
import type { PaymentGateway } from "../../infrastructure/gateways/PaymentGateway";
import { createPaymentGateway } from "../../infrastructure/gateways/createPaymentGateway";
import { findOneOrderById } from "../queries/findOneOrderById";
import { resolvePixPaymentDetails } from "./resolvePixPaymentDetails";

export async function getOrderPixPayment(
  redis: Redis | undefined,
  orderId: string,
  userId: string,
  gateway: PaymentGateway = createPaymentGateway(),
) {
  const order = await findOneOrderById(orderId);

  if (!order || order.userId !== userId) {
    throw new OrderNotFoundError(orderId);
  }

  const details = await resolvePixPaymentDetails(redis, order, gateway);

  if (!details) {
    throw new PaymentGatewayError(
      "PIX não disponível para este pedido",
      "PIX_NOT_AVAILABLE",
    );
  }

  return details;
}
