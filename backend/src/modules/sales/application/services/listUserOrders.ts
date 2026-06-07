import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import { OrderStatus } from "../../../../shared/kernel/enums";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { userIdSchema } from "../../../identity/validators/schema/userIdSchema";
import { resolvePixPaymentDetails } from "../../../payment/application/services/resolvePixPaymentDetails";
import { findOrdersByUserId } from "../queries/findOrdersByUserId";
import type { OrderListItem } from "./types";

export async function listUserOrders(
  dataSource: DataSource,
  userId: string,
  redis?: Redis,
): Promise<OrderListItem[]> {
  const id = validateSchema(userIdSchema, userId);
  const orders = await findOrdersByUserId(dataSource, id);

  return Promise.all(
    orders.map(async (order) => {
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
      };
    }),
  );
}
