import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { OrderStatus, TicketStatus } from "../../../../shared/kernel/enums";
import {
  OrderAlreadyRefundedError,
  OrderNotFoundError,
  OrderRefundNotAllowedError,
} from "../../domain/errors/PaymentError";
import type { PaymentGateway } from "../../infrastructure/gateways/PaymentGateway";
import { createPaymentGateway } from "../../infrastructure/gateways/createPaymentGateway";
import { refundOrder as refundOrderCommand } from "../commands/refundOrder";
import { clearPaymentCache } from "../helpers/clearPaymentCache";
import { clearReservationCache } from "../helpers/clearReservationCache";
import { findOneOrderById } from "../queries/findOneOrderById";
import { findTicketsByOrderId } from "../queries/findTicketsByOrderId";
import type { RefundOrderResult } from "../types";

const CONTEXT = "PaymentService";
const logger = Logger.getInstance();

export async function refundOrder(
  dataSource: DataSource,
  redis: Redis | undefined,
  orderId: string,
  gateway: PaymentGateway = createPaymentGateway(),
): Promise<RefundOrderResult> {
  logger.info(CONTEXT, "Starting order refund", { orderId });

  const order = await findOneOrderById(dataSource, orderId);

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

  const tickets = await findTicketsByOrderId(dataSource, orderId);

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

  const result = await refundOrderCommand(dataSource, orderId, redis);

  logger.info(CONTEXT, "Order refunded successfully", {
    orderId,
    ticketsCancelled: result.ticketsCancelled,
    stockRestored: result.stockRestored,
  });

  await clearPaymentCache(dataSource, redis, orderId);
  await clearReservationCache(dataSource, redis, orderId);

  return result;
}
