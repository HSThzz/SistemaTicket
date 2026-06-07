import type Redis from "ioredis";
import { OrderStatus } from "../../../../shared/kernel/enums";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { userIdSchema } from "../../../identity/validators/schema/userIdSchema";
import { resolvePixPaymentDetails } from "../../../payment/application/services/resolvePixPaymentDetails";
import { listUserOrdersQuerySchema } from "../../validators/schema/listUserOrdersQuerySchema";
import { findManyOrdersByUserId } from "../queries/findManyOrdersByUserId";

export interface OrderListItem {
  id: string;
  status: string;
  totalPrice: number;
  paymentGatewayId: string | null;
  reservationId: string;
  eventId: string | null;
  eventTitle: string | null;
  payment: Awaited<ReturnType<typeof resolvePixPaymentDetails>>;
}

export interface ListUserOrdersResult {
  orders: OrderListItem[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

async function mapOrderToListItem(
  order: Awaited<ReturnType<typeof findManyOrdersByUserId>>["orders"][number],
  redis?: Redis,
): Promise<OrderListItem> {
  const event = order.reservation?.ticketLot?.event;
  const payment =
    order.status === OrderStatus.PENDING
      ? await resolvePixPaymentDetails(redis, order)
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
}

export async function listUserOrders(
  userId: string,
  query: unknown = {},
  redis?: Redis,
): Promise<ListUserOrdersResult> {
  const id = validateSchema(userIdSchema, userId);
  const pagination = validateSchema(listUserOrdersQuerySchema, query);
  const filters = pagination.status ? { status: pagination.status } : undefined;

  const { orders, hasNextPage, nextCursor } = await findManyOrdersByUserId({
    userId: id,
    limit: pagination.limit,
    cursor: pagination.cursor,
    filters,
  });

  const mappedOrders = await Promise.all(
    orders.map((order) => mapOrderToListItem(order, redis)),
  );

  return {
    orders: mappedOrders,
    nextCursor,
    hasNextPage,
  };
}
