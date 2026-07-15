import type Redis from "ioredis";
import { OrderStatus } from "../../../../shared/kernel/enums";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { orderIdSchema } from "../../validators/schema/orderIdSchema";
import { OrderNotFoundError } from "../../../payment/domain/errors/PaymentError";
import { resolvePixPaymentDetailsReadOnly } from "../../../payment/application/helpers/resolvePixPaymentDetailsReadOnly";
import { findOneOrderByIdForAdmin } from "../queries/findOneOrderByIdForAdmin";

export async function getOrderByIdForAdmin(
  orderId: string,
  _redis?: Redis,
) {
  const id = validateSchema(orderIdSchema, orderId);
  const order = await findOneOrderByIdForAdmin(id);

  if (!order) {
    throw new OrderNotFoundError(id);
  }

  const event = order.reservation?.ticketLot?.event;
  const payment =
    order.status === OrderStatus.PENDING
      ? resolvePixPaymentDetailsReadOnly(order)
      : null;

  return {
    id: order.id,
    status: order.status,
    totalPrice: order.totalPrice,
    platformFeeCents: order.platformFeeCents,
    paymentGatewayId: order.paymentGatewayId,
    reservationId: order.reservationId,
    eventId: event?.id ?? null,
    eventTitle: event?.title ?? null,
    eventSlug: event?.slug ?? null,
    payment,
    userId: order.userId,
    userName: order.user.name,
    userEmail: order.user.email,
  };
}
