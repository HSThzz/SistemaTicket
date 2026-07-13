import type Redis from "ioredis";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { env } from "../../../../shared/infrastructure/config/env";
import { OrderStatus } from "../../../../shared/kernel/enums";
import { findOneOrderByReservationId } from "../../../sales/application/queries/findOneOrderByReservationId";
import { expireUnpaidOrderByReservationId as expireUnpaidOrderCommand } from "../commands/expireUnpaidOrderByReservationId";
import { clearPaymentCache } from "../helpers/clearPaymentCache";
import { clearReservationCache } from "../helpers/clearReservationCache";
import {
  clearReservationMeta,
  releaseRedisReservationHold,
} from "../../../sales/application/helpers/releaseRedisReservationHold";
import {
  createPaymentGateway,
  isMercadoPagoPixGateway,
} from "../../infrastructure/gateways/createPaymentGateway";
import { handlePaymentSucceeded } from "./handlePaymentSucceeded";

const CONTEXT = "PaymentService";
const logger = Logger.getInstance();

export async function expireUnpaidOrderByReservationId(
  redis: Redis | undefined,
  reservationId: string,
) {
  logger.info(CONTEXT, "Expiring unpaid order by reservation TTL", {
    reservationId,
  });

  // Antes de expirar: se o MP já aprovou, honra o pagamento (race TTL × webhook).
  if (redis && env.payment.gateway === "mercadopago") {
    const order = await findOneOrderByReservationId(reservationId);

    if (
      order &&
      order.status === OrderStatus.PENDING &&
      order.paymentGatewayId
    ) {
      const gateway = createPaymentGateway();

      if (isMercadoPagoPixGateway(gateway)) {
        try {
          const snapshot = await gateway.getPayment(order.paymentGatewayId);

          if (snapshot.status === "approved") {
            logger.warn(CONTEXT, "Expiry skipped — payment already approved at gateway", {
              reservationId,
              orderId: order.id,
              paymentGatewayId: order.paymentGatewayId,
            });

            await handlePaymentSucceeded(redis, {
              orderId: order.id,
              transactionId: snapshot.transactionId,
              paidAt: new Date().toISOString(),
            });

            return false;
          }
        } catch (error) {
          logger.warn(CONTEXT, "Could not verify gateway before expiry — proceeding to expire", {
            reservationId,
            orderId: order.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

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
