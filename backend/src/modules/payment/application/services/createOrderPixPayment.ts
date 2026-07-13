/**
 * @file Gera cobrança PIX sob demanda para um pedido pendente (checkout).
 * @module payment/application/services/createOrderPixPayment
 */

import type Redis from "ioredis";
import {
  PAYMENT_CACHE_KEY_PREFIX,
  RESERVATION_TTL_SECONDS,
} from "../../../../shared/infrastructure/config/constants";
import { OrderStatus } from "../../../../shared/kernel/enums";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import {
  OrderNotFoundError,
  PaymentAlreadyProcessedError,
  FreeOrderPaymentNotAllowedError,
} from "../../domain/errors/PaymentError";
import type { PaymentGateway } from "../../infrastructure/gateways/PaymentGateway";
import { createPaymentGateway } from "../../infrastructure/gateways/createPaymentGateway";
import { createPixPaymentSchema } from "../../validators/schema/createPixPaymentSchema";
import { findOneOrderByIdWithPaymentRelations } from "../queries/findOneOrderByIdWithPaymentRelations";
import type { PixPaymentDetails } from "../types";
import { processOrderPayment } from "./processOrderPayment";
import { resolvePixPaymentDetails } from "./resolvePixPaymentDetails";

export interface CreateOrderPixPaymentInput {
  orderId: string;
  requesterUserId: string;
}

/**
 * Cria (ou reutiliza) a cobrança PIX de um pedido quando o usuário escolhe PIX no checkout.
 *
 * @throws {OrderNotFoundError} Pedido inexistente ou de outro usuário.
 * @throws {PaymentAlreadyProcessedError} Pedido já pago ou em estado terminal.
 * @throws {FreeOrderPaymentNotAllowedError} Pedido com total zero.
 */
export async function createOrderPixPayment(
  redis: Redis | undefined,
  input: CreateOrderPixPaymentInput,
  gateway: PaymentGateway = createPaymentGateway(),
): Promise<PixPaymentDetails> {
  const data = validateSchema(createPixPaymentSchema, input);

  const order = await findOneOrderByIdWithPaymentRelations(data.orderId);

  if (!order?.user || order.userId !== data.requesterUserId) {
    throw new OrderNotFoundError(data.orderId);
  }

  if (order.totalPrice === 0) {
    throw new FreeOrderPaymentNotAllowedError(data.orderId);
  }

  if (order.status !== OrderStatus.PENDING) {
    throw new PaymentAlreadyProcessedError(data.orderId, order.status);
  }

  const existing = await resolvePixPaymentDetails(redis, order, gateway);
  if (existing) {
    if (redis) {
      await redis.setex(
        `${PAYMENT_CACHE_KEY_PREFIX}${order.reservationId}`,
        RESERVATION_TTL_SECONDS,
        JSON.stringify(existing),
      );
    }
    return existing;
  }

  return processOrderPayment(redis, order.id, gateway);
}
