import type Redis from "ioredis";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { OrderStatus, TicketStatus } from "../../../../shared/kernel/enums";
import { enqueueOrderRefundNotification } from "../../../notifications/application/commands/enqueueOrderRefundNotification";
import {
  OrderAlreadyRefundedError,
  OrderNotFoundError,
  OrderRefundNotAllowedError,
  RefundLocalStateError,
} from "../../domain/errors/PaymentError";
import type { PaymentGateway } from "../../infrastructure/gateways/PaymentGateway";
import { createPaymentGateway } from "../../infrastructure/gateways/createPaymentGateway";
import { refundOrder as refundOrderCommand } from "../commands/refundOrder";
import { shouldSkipGatewayRefund } from "../helpers/shouldSkipGatewayRefund";
import { clearPaymentCache } from "../helpers/clearPaymentCache";
import { clearReservationCache } from "../helpers/clearReservationCache";
import { findOneOrderById } from "../queries/findOneOrderById";
import { findTicketsByOrderId } from "../queries/findTicketsByOrderId";

const CONTEXT = "PaymentService";
const logger = Logger.getInstance();
const LOCAL_REFUND_ATTEMPTS = 3;

export type RefundOrderOptions = {
  /**
   * Quando true, não chama o gateway (ex.: webhook `refunded`/`charged_back`
   * — o dinheiro já foi movido no Mercado Pago).
   */
  skipGatewayRefund?: boolean;
  /** Se false, não enfileira e-mail (útil em testes). Default true. */
  notifyBuyer?: boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function refundOrder(
  redis: Redis | undefined,
  orderId: string,
  gateway: PaymentGateway = createPaymentGateway(),
  options: RefundOrderOptions = {},
) {
  logger.info(CONTEXT, "Starting order refund", {
    orderId,
    skipGatewayRefund: Boolean(options.skipGatewayRefund),
  });

  const order = await findOneOrderById(orderId);

  if (!order) {
    throw new OrderNotFoundError(orderId);
  }

  if (order.status === OrderStatus.REFUNDED) {
    throw new OrderAlreadyRefundedError(orderId);
  }

  if (order.status !== OrderStatus.PAID) {
    throw new OrderRefundNotAllowedError(
      `Order ${orderId} with status ${order.status} cannot be refunded`,
    );
  }

  const tickets = await findTicketsByOrderId(orderId);

  const hasUsedTicket = tickets.some(
    (ticket) =>
      ticket.status === TicketStatus.USED || ticket.checkedInAt !== null,
  );

  if (hasUsedTicket) {
    throw new OrderRefundNotAllowedError(
      `Order ${orderId} has used tickets and cannot be refunded`,
      "TICKET_ALREADY_USED",
    );
  }

  if (
    !shouldSkipGatewayRefund(order.paymentGatewayId, {
      skipGatewayRefund: options.skipGatewayRefund,
    })
  ) {
    await gateway.refundPayment(order.paymentGatewayId!);
  } else {
    logger.info(CONTEXT, "Skipping gateway refund", {
      orderId,
      paymentGatewayId: order.paymentGatewayId,
      reason: options.skipGatewayRefund ? "skipGatewayRefund" : "non_mp_id",
    });
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= LOCAL_REFUND_ATTEMPTS; attempt += 1) {
    try {
      const result = await refundOrderCommand(orderId, redis);

      logger.info(CONTEXT, "Order refunded successfully", {
        orderId,
        ticketsCancelled: result.ticketsCancelled,
        stockRestored: result.stockRestored,
        attempt,
      });

      await clearPaymentCache(redis, orderId);
      await clearReservationCache(redis, orderId);

      if (options.notifyBuyer !== false) {
        try {
          await enqueueOrderRefundNotification(orderId);
        } catch (notifyError) {
          logger.error(CONTEXT, "Failed to enqueue refund notification", {
            orderId,
            error:
              notifyError instanceof Error
                ? notifyError.message
                : String(notifyError),
          });
        }
      }

      return result;
    } catch (error) {
      if (error instanceof OrderAlreadyRefundedError) {
        logger.info(CONTEXT, "Local refund already applied after gateway refund", {
          orderId,
        });
        await clearPaymentCache(redis, orderId);
        await clearReservationCache(redis, orderId);
        return {
          orderId,
          ticketsCancelled: 0,
          stockRestored: 0,
        };
      }

      lastError = error;
      logger.error(CONTEXT, "Local refund state update failed after gateway refund", {
        orderId,
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });

      if (attempt < LOCAL_REFUND_ATTEMPTS) {
        await sleep(100 * attempt);
      }
    }
  }

  throw new RefundLocalStateError(
    orderId,
    lastError instanceof Error ? lastError.message : String(lastError),
  );
}
