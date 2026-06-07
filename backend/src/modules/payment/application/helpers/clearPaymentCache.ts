import type Redis from "ioredis";
import {
  ORDER_CACHE_KEY_PREFIX,
  PAYMENT_CACHE_KEY_PREFIX,
} from "../../../../shared/infrastructure/config/constants";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { findOneOrderReservationIdById } from "../queries/findOneOrderReservationIdById";

const CONTEXT = "PaymentService";

export async function clearPaymentCache(
  redis: Redis | undefined,
  orderId: string,
): Promise<void> {
  if (!redis) {
    return;
  }

  const order = await findOneOrderReservationIdById(orderId);

  if (!order) {
    return;
  }

  await redis.del(`${PAYMENT_CACHE_KEY_PREFIX}${order.reservationId}`);
  await redis.del(`${ORDER_CACHE_KEY_PREFIX}${order.reservationId}`);

  Logger.getInstance().debug(CONTEXT, "Payment cache keys removed", {
    orderId,
    reservationId: order.reservationId,
  });
}
