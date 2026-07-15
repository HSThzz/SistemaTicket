import type Redis from "ioredis";
import { OrderStatus } from "../../../../shared/kernel/enums";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { userIdSchema } from "../../../identity/validators/schema/userIdSchema";
import {
  batchLoadPixPaymentsFromCache,
  resolvePixPaymentDetailsReadOnly,
} from "../../../payment/application/helpers/resolvePixPaymentDetailsReadOnly";
import type { PixPaymentDetails } from "../../../payment/application/types";
import { listUserOrdersQuerySchema } from "../../validators/schema/listUserOrdersQuerySchema";
import { findManyOrdersByUserId } from "../queries/findManyOrdersByUserId";
import { findOneOrderById } from "../../../payment/application/queries/findOneOrderById";
import { reconcilePendingMercadoPagoPayment } from "../../../payment/application/services/reconcilePendingMercadoPagoPayment";

export interface OrderListItem {
  id: string;
  status: string;
  totalPrice: number;
  platformFeeCents: number;
  paymentGatewayId: string | null;
  reservationId: string;
  eventId: string | null;
  eventSlug: string | null;
  eventTitle: string | null;
  createdAt: string;
  payment: PixPaymentDetails | null;
}

export interface ListUserOrdersResult {
  orders: OrderListItem[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

function mapOrderToListItem(
  order: Awaited<ReturnType<typeof findManyOrdersByUserId>>["orders"][number],
  paymentCache: Map<string, PixPaymentDetails>,
): OrderListItem {
  const event = order.reservation?.ticketLot?.event;
  const payment =
    order.status === OrderStatus.PENDING
      ? resolvePixPaymentDetailsReadOnly(
          order,
          paymentCache.get(order.reservationId),
        )
      : null;

  return {
    id: order.id,
    status: order.status,
    totalPrice: order.totalPrice,
    platformFeeCents: order.platformFeeCents,
    paymentGatewayId: order.paymentGatewayId,
    reservationId: order.reservationId,
    eventId: event?.id ?? null,
    eventSlug: event?.slug ?? null,
    eventTitle: event?.title ?? null,
    createdAt: order.createdAt.toISOString(),
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

  const pendingReservationIds = orders
    .filter((order) => order.status === OrderStatus.PENDING)
    .map((order) => order.reservationId);

  const paymentCache =
    redis && pendingReservationIds.length > 0
      ? await batchLoadPixPaymentsFromCache(redis, pendingReservationIds)
      : new Map<string, PixPaymentDetails>();

  if (redis) {
    for (const order of orders) {
      if (order.status === OrderStatus.PENDING && order.paymentGatewayId) {
        const reconciled = await reconcilePendingMercadoPagoPayment(redis, order);
        if (reconciled) {
          const refreshed = await findOneOrderById(order.id);
          if (refreshed) {
            order.status = refreshed.status;
            order.paymentGatewayId = refreshed.paymentGatewayId;
          }
        }
      }
    }
  }

  return {
    orders: orders.map((order) => mapOrderToListItem(order, paymentCache)),
    nextCursor,
    hasNextPage,
  };
}
