/**
 * @file Reconcilia PIX pendente do pedido autenticado consultando o Mercado Pago.
 * @module payment/application/services/reconcileOrderPixPayment
 */

import type Redis from "ioredis";
import { OrderStatus } from "../../../../shared/kernel/enums";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { OrderNotFoundError } from "../../domain/errors/PaymentError";
import { createPixPaymentSchema } from "../../validators/schema/createPixPaymentSchema";
import { findOneOrderById } from "../queries/findOneOrderById";
import { reconcilePendingMercadoPagoPayment } from "./reconcilePendingMercadoPagoPayment";

export interface ReconcileOrderPixPaymentInput {
  orderId: string;
  requesterUserId: string;
}

export interface ReconcileOrderPixPaymentResult {
  reconciled: boolean;
  status: string;
}

export async function reconcileOrderPixPayment(
  redis: Redis,
  input: ReconcileOrderPixPaymentInput,
): Promise<ReconcileOrderPixPaymentResult> {
  const data = validateSchema(createPixPaymentSchema, input);

  const order = await findOneOrderById(data.orderId);

  if (!order || order.userId !== data.requesterUserId) {
    throw new OrderNotFoundError(data.orderId);
  }

  if (order.status !== OrderStatus.PENDING || !order.paymentGatewayId) {
    return {
      reconciled: false,
      status: order.status,
    };
  }

  const reconciled = await reconcilePendingMercadoPagoPayment(redis, order);

  if (!reconciled) {
    const refreshed = await findOneOrderById(data.orderId);
    return {
      reconciled: false,
      status: refreshed?.status ?? order.status,
    };
  }

  const refreshed = await findOneOrderById(data.orderId);
  return {
    reconciled: true,
    status: refreshed?.status ?? OrderStatus.PAID,
  };
}
