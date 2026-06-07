import type Redis from "ioredis";
import { RESERVATION_KEY_PREFIX } from "../../../../shared/infrastructure/config/constants";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { findOneOrderReservationIdById } from "../queries/findOneOrderReservationIdById";

const CONTEXT = "PaymentService";

export async function clearReservationCache(
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

  const cacheKey = `${RESERVATION_KEY_PREFIX}${order.reservationId}`;
  await redis.del(cacheKey);

  Logger.getInstance().debug(CONTEXT, "Reservation cache key removed after payment", {
    orderId,
    reservationId: order.reservationId,
    redisKey: cacheKey,
  });
}
