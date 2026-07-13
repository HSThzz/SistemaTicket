import type Redis from "ioredis";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { OrderStatus, TicketStatus } from "../../../../shared/kernel/enums";
import {
  OrderAlreadyRefundedError,
  OrderNotFoundError,
  OrderRefundNotAllowedError,
  RefundLocalStateError,
} from "../../domain/errors/PaymentError";
import type { PaymentGateway } from "../../infrastructure/gateways/PaymentGateway";
import { createPaymentGateway } from "../../infrastructure/gateways/createPaymentGateway";
import { refundOrder as refundOrderCommand } from "../commands/refundOrder";
import { clearPaymentCache } from "../helpers/clearPaymentCache";
import { clearReservationCache } from "../helpers/clearReservationCache";
import { findOneOrderById } from "../queries/findOneOrderById";
import { findTicketsByOrderId } from "../queries/findTicketsByOrderId";

const CONTEXT = "PaymentService";
const logger = Logger.getInstance();
const LOCAL_REFUND_ATTEMPTS = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function refundOrder(
  redis: Redis | undefined,
  orderId: string,
  gateway: PaymentGateway = createPaymentGateway(),
) {
  logger.info(CONTEXT, "Starting order refund", { orderId });

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

  if (order.paymentGatewayId) {
    await gateway.refundPayment(order.paymentGatewayId);
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
