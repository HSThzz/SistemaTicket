import type Redis from "ioredis";
import {
  ORDER_CACHE_KEY_PREFIX,
  PAYMENT_CACHE_KEY_PREFIX,
  RESERVATION_KEY_PREFIX,
} from "../../../../shared/infrastructure/config/constants";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { QueueMonitorService } from "../../../../shared/application/QueueMonitorService";
import type { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import type { Reservation } from "../../../../shared/infrastructure/persistence/entities/Reservation";
import { OrderStatus, ReservationStatus } from "../../../../shared/kernel/enums";
import {
  ReservationAccessDeniedError,
  ReservationNotFoundError,
} from "../../domain/errors/PurchaseError";
import { findOneOrderById } from "../queries/findOneOrderById";
import { findOneOrderByReservationId } from "../queries/findOneOrderByReservationId";
import { findOneReservationById } from "../queries/findOneReservationById";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { getReservationStatusSchema } from "../../validators/schema/getReservationStatusSchema";
import type {
  ReservationPhase,
  ReservationRedisPayload,
  ReservationStatusView,
} from "./types";
import type { PixPaymentDetails } from "../../../payment/application/types";

const CONTEXT = "getReservationStatus";

export async function getReservationStatus(
  redis: Redis,
  reservationId: string,
  requesterUserId: string,
) {
  const data = validateSchema(getReservationStatusSchema, {
    reservationId,
    requesterUserId,
  });

  const logger = Logger.getInstance();
  const queueMonitor = new QueueMonitorService(redis);

  const [redisRaw, paymentRaw, orderIdCached, dbReservation, queueStats] =
    await Promise.all([
      redis.get(`${RESERVATION_KEY_PREFIX}${data.reservationId}`),
      redis.get(`${PAYMENT_CACHE_KEY_PREFIX}${data.reservationId}`),
      redis.get(`${ORDER_CACHE_KEY_PREFIX}${data.reservationId}`),
      findOneReservationById(data.reservationId),
      queueMonitor.getStats(),
    ]);

  const redisPayload = redisRaw
    ? (JSON.parse(redisRaw) as ReservationRedisPayload)
    : null;

  const payment = paymentRaw ? (JSON.parse(paymentRaw) as PixPaymentDetails) : null;

  if (!redisPayload && !dbReservation) {
    throw new ReservationNotFoundError(data.reservationId);
  }

  const ownerId = redisPayload?.userId ?? dbReservation?.userId;
  if (!ownerId || ownerId !== data.requesterUserId) {
    throw new ReservationAccessDeniedError();
  }

  let order: Order | null = null;
  if (dbReservation) {
    order = await findOneOrderByReservationId(data.reservationId);
  } else if (orderIdCached) {
    order = await findOneOrderById(orderIdCached);
  }

  const phase = resolvePhase(dbReservation, order, payment, redisPayload);

  logger.info(CONTEXT, "Reservation status queried", {
    reservationId: data.reservationId,
    phase,
    requesterUserId: data.requesterUserId,
    queuePendingJobs: queueStats.persistQueueLength,
  });

  return {
    reservationId: data.reservationId,
    phase,
    reservation: buildReservationView(dbReservation, redisPayload),
    order: order
      ? {
          id: order.id,
          status: order.status,
          totalPrice: order.totalPrice,
          paymentGatewayId: order.paymentGatewayId,
        }
      : null,
    payment,
    meta: {
      inRedis: Boolean(redisPayload),
      persistedToPostgres: Boolean(dbReservation),
      queuePendingJobs: queueStats.persistQueueLength,
    },
  };
}

function resolvePhase(
  dbReservation: Reservation | null,
  order: Order | null,
  payment: PixPaymentDetails | null,
  redisPayload: ReservationRedisPayload | null,
): ReservationPhase {
  if (!dbReservation && redisPayload) {
    return "PENDING_PERSISTENCE";
  }

  if (dbReservation?.status === ReservationStatus.COMPLETED) {
    return "PAID";
  }

  if (dbReservation?.status === ReservationStatus.EXPIRED) {
    return order?.status === OrderStatus.FAILED ? "FAILED" : "EXPIRED";
  }

  if (order?.status === OrderStatus.FAILED) {
    return "FAILED";
  }

  if (order?.status === OrderStatus.PAID) {
    return "PAID";
  }

  if (payment) {
    return "AWAITING_PAYMENT";
  }

  if (dbReservation) {
    return "PENDING_PAYMENT";
  }

  return "NOT_FOUND";
}

function buildReservationView(
  dbReservation: Reservation | null,
  redisPayload: ReservationRedisPayload | null,
): ReservationStatusView["reservation"] {
  if (dbReservation) {
    return {
      id: dbReservation.id,
      status: dbReservation.status,
      expiresAt: dbReservation.expiresAt.toISOString(),
      quantity: dbReservation.quantity,
      ticketLotId: dbReservation.ticketLotId,
    };
  }

  if (redisPayload) {
    return {
      id: redisPayload.reservationId,
      status: "PENDING_PERSISTENCE",
      expiresAt: redisPayload.expiresAt,
      quantity: redisPayload.quantity,
      ticketLotId: redisPayload.ticketLotId,
    };
  }

  return null;
}
