/**
 * @file Aplica reembolso local quando o MP notifica refunded/charged_back.
 * @module modules/payment/application/services/handlePaymentRefunded
 */

import type Redis from "ioredis";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { OrderStatus } from "../../../../shared/kernel/enums";
import {
  OrderAlreadyRefundedError,
  OrderNotFoundError,
  OrderRefundNotAllowedError,
} from "../../domain/errors/PaymentError";
import { findOneOrderById } from "../queries/findOneOrderById";
import type { PaymentWebhookPayload } from "../types";
import { refundOrder } from "./refundOrder";

const CONTEXT = "PaymentService";
const logger = Logger.getInstance();

/**
 * Sincroniza estado local após reembolso/chargeback externo no gateway.
 * Não chama o MP de novo (`skipGatewayRefund`).
 */
export async function handlePaymentRefunded(
  redis: Redis | undefined,
  data: PaymentWebhookPayload["data"],
): Promise<void> {
  const order = await findOneOrderById(data.orderId);

  if (!order) {
    logger.warn(CONTEXT, "Refund webhook for unknown order — ignored", {
      orderId: data.orderId,
      transactionId: data.transactionId,
    });
    return;
  }

  if (order.status === OrderStatus.REFUNDED) {
    logger.info(CONTEXT, "Refund webhook — order already refunded", {
      orderId: data.orderId,
    });
    return;
  }

  if (order.status !== OrderStatus.PAID) {
    logger.info(CONTEXT, "Refund webhook on non-PAID order — deferred to failure handler", {
      orderId: data.orderId,
      status: order.status,
      transactionId: data.transactionId,
    });
    return;
  }

  try {
    await refundOrder(redis, data.orderId, undefined, {
      skipGatewayRefund: true,
    });

    logger.info(CONTEXT, "Local refund applied from gateway webhook", {
      orderId: data.orderId,
      transactionId: data.transactionId,
    });
  } catch (error) {
    if (error instanceof OrderAlreadyRefundedError) {
      return;
    }

    if (error instanceof OrderNotFoundError) {
      logger.warn(CONTEXT, "Refund webhook order disappeared", {
        orderId: data.orderId,
      });
      return;
    }

    if (error instanceof OrderRefundNotAllowedError) {
      logger.error(CONTEXT, "Refund webhook cannot cancel tickets locally", {
        orderId: data.orderId,
        code: error.code,
        error: error.message,
        transactionId: data.transactionId,
      });
      return;
    }

    throw error;
  }
}
