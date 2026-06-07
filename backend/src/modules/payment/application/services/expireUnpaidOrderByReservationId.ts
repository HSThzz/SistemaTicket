import type Redis from "ioredis";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { expireUnpaidOrderByReservationId as expireUnpaidOrderCommand } from "../commands/expireUnpaidOrderByReservationId";
import { clearPaymentCache } from "../helpers/clearPaymentCache";
import { clearReservationCache } from "../helpers/clearReservationCache";

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

  if (!expired) {
    logger.warn(
      CONTEXT,
      "Reservation not found or no longer pending on expiry",
      { reservationId },
    );
    return false;
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
