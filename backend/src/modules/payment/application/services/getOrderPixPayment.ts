import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import {
  OrderNotFoundError,
  PaymentGatewayError,
} from "../../domain/errors/PaymentError";
import type { PaymentGateway } from "../../infrastructure/gateways/PaymentGateway";
import { createPaymentGateway } from "../../infrastructure/gateways/createPaymentGateway";
import { findOneOrderById } from "../queries/findOneOrderById";
import { resolvePixPaymentDetails } from "./resolvePixPaymentDetails";
import type { PixPaymentDetails } from "../types";

export async function getOrderPixPayment(
  dataSource: DataSource,
  redis: Redis | undefined,
  orderId: string,
  userId: string,
  gateway: PaymentGateway = createPaymentGateway(),
): Promise<PixPaymentDetails> {
  const order = await findOneOrderById(dataSource, orderId);

  if (!order || order.userId !== userId) {
    throw new OrderNotFoundError(orderId);
  }

  const details = await resolvePixPaymentDetails(dataSource, redis, order, gateway);

  if (!details) {
    throw new PaymentGatewayError(
      "PIX não disponível para este pedido",
      "PIX_NOT_AVAILABLE",
    );
  }

  return details;
}
