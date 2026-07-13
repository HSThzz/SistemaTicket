/**
 * @file Processa pagamento via cartão de crédito (Mercado Pago) para um pedido existente.
 * @module payment/application/services/processCardPayment
 */

import type Redis from "ioredis";
import { withLock } from "../../../../shared/application/DistributedLock";
import { LOCK_ORDER_PAYMENT_KEY_PREFIX } from "../../../../shared/infrastructure/config/constants";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { OrderStatus } from "../../../../shared/kernel/enums";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import {
  CardPaymentUnsupportedError,
  FreeOrderPaymentNotAllowedError,
  OrderNotFoundError,
  PaymentAlreadyProcessedError,
} from "../../domain/errors/PaymentError";
import type { PaymentGateway } from "../../infrastructure/gateways/PaymentGateway";
import {
  createPaymentGateway,
  isMercadoPagoPixGateway,
} from "../../infrastructure/gateways/createPaymentGateway";
import { normalizePayerEmail } from "../helpers/resolveMercadoPagoPayerEmail";
import { findOneOrderByIdWithPaymentRelations } from "../queries/findOneOrderByIdWithPaymentRelations";
import { updateOrder } from "../commands/updateOrder";
import { createCardPaymentSchema } from "../../validators/schema/createCardPaymentSchema";
import { handleWebhook } from "./handleWebhook";

const CONTEXT = "PaymentService";
const logger = Logger.getInstance();

/** Resultado consolidado do processamento de um pagamento via cartão. */
export interface CardPaymentResult {
  orderId: string;
  transactionId: string;
  /** Status normalizado: `approved`, `pending`, `rejected`. */
  status: "approved" | "pending" | "rejected";
  /** Detalhe técnico do status retornado pelo Mercado Pago. */
  statusDetail?: string;
}

export interface ProcessCardPaymentInput {
  orderId: string;
  requesterUserId: string;
  token: string;
  paymentMethodId: string;
  issuerId: number;
  installments?: number;
  payerEmail?: string;
  payerDocument?: string;
}

/**
 * Cobra um pedido pendente via cartão de crédito usando o token gerado no front.
 *
 * - `approved` → marca o pedido como pago e emite ingressos (mesmo fluxo do PIX).
 * - `pending`/`in_process` → mantém o pedido pendente; a confirmação chega por webhook.
 * - `rejected`/`cancelled` → não falha o pedido, permitindo nova tentativa dentro da reserva.
 *
 * @throws {OrderNotFoundError} Pedido inexistente ou de outro usuário.
 * @throws {PaymentAlreadyProcessedError} Pedido já pago/falho.
 * @throws {CardPaymentUnsupportedError} Gateway atual não suporta cartão.
 */
export async function processCardPayment(
  redis: Redis | undefined,
  input: ProcessCardPaymentInput,
  gateway: PaymentGateway = createPaymentGateway(),
): Promise<CardPaymentResult> {
  const data = validateSchema(createCardPaymentSchema, {
    ...input,
    installments: input.installments ?? 1,
  });

  if (!isMercadoPagoPixGateway(gateway)) {
    throw new CardPaymentUnsupportedError();
  }

  const executeCharge = async (): Promise<CardPaymentResult> => {
    const order = await findOneOrderByIdWithPaymentRelations(data.orderId);

    if (!order?.user || order.userId !== data.requesterUserId) {
      throw new OrderNotFoundError(data.orderId);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new PaymentAlreadyProcessedError(data.orderId, order.status);
    }

    if (order.totalPrice === 0) {
      throw new FreeOrderPaymentNotAllowedError(order.id);
    }

    logger.info(CONTEXT, "Starting credit card charge", {
      orderId: order.id,
      paymentMethodId: data.paymentMethodId,
      issuerId: data.issuerId,
      installments: data.installments,
    });

    const charge = await gateway.createCardCharge({
      orderId: order.id,
      amountCents: order.totalPrice,
      description: `Ingressos pedido ${order.id.slice(0, 8)}`,
      token: data.token,
      paymentMethodId: data.paymentMethodId,
      issuerId: data.issuerId,
      installments: data.installments,
      payerEmail: normalizePayerEmail(data.payerEmail ?? order.user.email),
      payerDocument: data.payerDocument ?? order.user.document,
    });

    logger.info(CONTEXT, "Credit card charge created", {
      orderId: order.id,
      transactionId: charge.transactionId,
      status: charge.status,
      statusDetail: charge.statusDetail,
    });

    await updateOrder(order, { paymentGatewayId: charge.transactionId });

    if (charge.status === "approved") {
      await handleWebhook(
        redis,
        {
          event: "payment.succeeded",
          data: {
            orderId: order.id,
            transactionId: charge.transactionId,
            paidAt: new Date().toISOString(),
          },
        },
        gateway,
      );

      return {
        orderId: order.id,
        transactionId: charge.transactionId,
        status: "approved",
        statusDetail: charge.statusDetail,
      };
    }

    if (charge.status === "pending") {
      return {
        orderId: order.id,
        transactionId: charge.transactionId,
        status: "pending",
        statusDetail: charge.statusDetail,
      };
    }

    return {
      orderId: order.id,
      transactionId: charge.transactionId,
      status: "rejected",
      statusDetail: charge.statusDetail,
    };
  };

  if (!redis) {
    return executeCharge();
  }

  return withLock(
    redis,
    `${LOCK_ORDER_PAYMENT_KEY_PREFIX}${data.orderId}`,
    30_000,
    executeCharge,
  );
}
