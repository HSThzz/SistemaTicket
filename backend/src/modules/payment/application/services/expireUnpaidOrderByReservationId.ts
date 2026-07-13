import type Redis from "ioredis";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { expireUnpaidOrderByReservationId as expireUnpaidOrderCommand } from "../commands/expireUnpaidOrderByReservationId";
import { clearPaymentCache } from "../helpers/clearPaymentCache";
import { clearReservationCache } from "../helpers/clearReservationCache";
import {
  clearReservationMeta,
  releaseRedisReservationHold,
} from "../../../sales/application/helpers/releaseRedisReservationHold";

const CONTEXT = "PaymentService";
const logger = Logger.getInstance();

export async function expireUnpaidOrderByReservationId(
  redis: Redis | undefined,
  reservationId: string,
) {
  logger.info(CONTEXT, "Expiring unpaid order by reservation TTL", {
    reservationId,
  });

  const { expired, orderId } = await expireUnpaidOrderCommand(reservationId,
    redis,
  );

  if (expired) {
    if (redis) {
      await clearReservationMeta(redis, reservationId);
    }

    logger.info(CONTEXT, "Unpaid order expired — stock restored", {
      reservationId,
      orderId,
    });

    if (orderId) {
      await clearReservationCache(redis, orderId);
      await clearPaymentCache(redis, orderId);
    }

    return true;
  }

  // Reserva nunca chegou ao Postgres: devolve hold Redis via meta (idempotente).
  if (redis) {
    const released = await releaseRedisReservationHold(redis, reservationId);

    if (released) {
      logger.info(CONTEXT, "Redis-only reservation expired — stock restored from meta", {
        reservationId,
      });
      return true;
    }
  }

  logger.warn(
    CONTEXT,
    "Reservation not found or no longer pending on expiry",
    { reservationId },
  );

  return false;
}
