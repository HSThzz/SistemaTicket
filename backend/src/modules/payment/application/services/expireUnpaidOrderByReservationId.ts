import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { expireUnpaidOrderByReservationId as expireUnpaidOrderCommand } from "../commands/expireUnpaidOrderByReservationId";
import { clearPaymentCache } from "../helpers/clearPaymentCache";
import { clearReservationCache } from "../helpers/clearReservationCache";

const CONTEXT = "PaymentService";
const logger = Logger.getInstance();

export async function expireUnpaidOrderByReservationId(
  dataSource: DataSource,
  redis: Redis | undefined,
  reservationId: string,
): Promise<boolean> {
  logger.info(CONTEXT, "Expiring unpaid order by reservation TTL", {
    reservationId,
  });

  const { expired, orderId } = await expireUnpaidOrderCommand(
    dataSource,
    reservationId,
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
    await clearReservationCache(dataSource, redis, orderId);
    await clearPaymentCache(dataSource, redis, orderId);
  }

  return true;
}
