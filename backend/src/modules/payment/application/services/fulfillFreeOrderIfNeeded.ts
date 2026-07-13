/**
 * @file Auto-confirma pedido gratuito (total 0) sem gateway de pagamento.
 * @module modules/payment/application/services/fulfillFreeOrderIfNeeded
 */

import type Redis from "ioredis";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { OrderStatus } from "../../../../shared/kernel/enums";
import { findOneOrderById } from "../queries/findOneOrderById";
import { handlePaymentSucceeded } from "./handlePaymentSucceeded";

const CONTEXT = "fulfillFreeOrderIfNeeded";
const logger = Logger.getInstance();

/**
 * Se o pedido tem `totalPrice === 0` e ainda está PENDING, emite ingressos
 * pelo mesmo caminho de pagamento confirmado (`free:{orderId}`).
 */
export async function fulfillFreeOrderIfNeeded(
  redis: Redis | undefined,
  orderId: string,
): Promise<boolean> {
  const order = await findOneOrderById(orderId);

  if (!order || order.totalPrice !== 0) {
    return false;
  }

  if (order.status !== OrderStatus.PENDING) {
    return order.status === OrderStatus.PAID;
  }

  logger.info(CONTEXT, "Fulfilling free order", { orderId });

  await handlePaymentSucceeded(redis, {
    orderId: order.id,
    transactionId: `free:${order.id}`,
    paidAt: new Date().toISOString(),
  });

  return true;
}
