/**
 * @file Consulta o Mercado Pago quando o pedido ainda está pendente (fallback ao webhook).
 * @module payment/application/services/reconcilePendingMercadoPagoPayment
 */

import type Redis from "ioredis";
import { env } from "../../../../shared/infrastructure/config/env";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import type { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { OrderStatus } from "../../../../shared/kernel/enums";
import { PaymentAlreadyProcessedError } from "../../domain/errors/PaymentError";
import { handleMercadoPagoNotification } from "./handleMercadoPagoNotification";

const CONTEXT = "reconcilePendingMercadoPagoPayment";
const RECONCILE_THROTTLE_SECONDS = 4;

/**
 * Verifica na API do MP se um PIX pendente já foi pago e processa o pedido.
 * Usado durante o poll do checkout quando o webhook não chegou a tempo.
 */
export async function reconcilePendingMercadoPagoPayment(
  redis: Redis,
  order: Order,
): Promise<boolean> {
  if (env.payment.gateway !== "mercadopago") {
    return false;
  }

  if (order.status !== OrderStatus.PENDING || !order.paymentGatewayId) {
    return false;
  }

  const throttleKey = `payment:reconcile:${order.id}`;
  const acquired = await redis.set(
    throttleKey,
    "1",
    "EX",
    RECONCILE_THROTTLE_SECONDS,
    "NX",
  );

  if (acquired !== "OK") {
    return false;
  }

  const logger = Logger.getInstance();

  logger.info(CONTEXT, "Checking Mercado Pago payment status", {
    orderId: order.id,
    paymentGatewayId: order.paymentGatewayId,
  });

  try {
    const result = await handleMercadoPagoNotification(
      redis,
      order.paymentGatewayId,
    );

    if (result === "processed") {
      logger.info(CONTEXT, "Pending Mercado Pago payment reconciled", {
        orderId: order.id,
        paymentGatewayId: order.paymentGatewayId,
      });
      return true;
    }

    return false;
  } catch (error) {
    if (error instanceof PaymentAlreadyProcessedError) {
      return true;
    }

    logger.warn(CONTEXT, "Mercado Pago reconciliation failed", {
      orderId: order.id,
      paymentGatewayId: order.paymentGatewayId,
      error: error instanceof Error ? error.message : String(error),
    });

    return false;
  }
}
