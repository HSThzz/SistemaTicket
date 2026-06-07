import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import { OrderStatus } from "../../../../shared/kernel/enums";
import { OrderNotFoundError } from "../../../payment/domain/errors/PaymentError";
import { resolvePixPaymentDetails } from "../../../payment/application/services/resolvePixPaymentDetails";
import { findOneOrderByIdForAdmin } from "../queries/findOneOrderByIdForAdmin";
import type { OrderAdminDetails } from "./types";

export async function getOrderByIdForAdmin(
  dataSource: DataSource,
  orderId: string,
  redis?: Redis,
): Promise<OrderAdminDetails> {
  const order = await findOneOrderByIdForAdmin(dataSource, orderId);

  if (!order) {
    throw new OrderNotFoundError(orderId);
  }

  const event = order.reservation?.ticketLot?.event;
  const payment =
    order.status === OrderStatus.PENDING
      ? await resolvePixPaymentDetails(dataSource, redis, order)
      : null;

  return {
    id: order.id,
    status: order.status,
    totalPrice: order.totalPrice,
    paymentGatewayId: order.paymentGatewayId,
    reservationId: order.reservationId,
    eventId: event?.id ?? null,
    eventTitle: event?.title ?? null,
    payment,
    userId: order.userId,
    userName: order.user.name,
    userEmail: order.user.email,
  };
}
