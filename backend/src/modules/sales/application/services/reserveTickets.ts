import type Redis from "ioredis";
import { randomUUID } from "node:crypto";
import {
  LOCK_STOCK_INIT_KEY_PREFIX,
  RESERVATION_KEY_PREFIX,
  RESERVATION_META_GRACE_SECONDS,
  RESERVATION_META_KEY_PREFIX,
  RESERVATION_PERSIST_QUEUE_KEY,
  RESERVATION_TTL_MS,
  RESERVATION_TTL_SECONDS,
  TICKET_LOT_STOCK_KEY_PREFIX,
} from "../../../../shared/infrastructure/config/constants";
import {
  acquireLock,
  releaseLock,
} from "../../../../shared/application/DistributedLock";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { EventStatus } from "../../../../shared/kernel/enums";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import {
  EventNotOnSaleError,
  InsufficientStockError,
  ParticipationLotNotAllowedError,
  ParticipationNotApprovedError,
  PendingOrderExistsError,
  ReserveUserNotFoundError,
  TicketLotNotFoundError,
} from "../../domain/errors/PurchaseError";
import { reserveTicketsSchema } from "../../validators/schema/reserveTicketsSchema";
import { findPendingOrderByUserId } from "../queries/findPendingOrderByUserId";
import { findTicketLotForPurchase } from "../queries/findTicketLotForPurchase";
import { findOneUserById } from "../../../identity/application/queries/findOneUserById";
import { checkParticipationAccess } from "../../../participation/application/services/checkParticipationAccess";
import { sumPendingQuantityForLot } from "../helpers/sumPendingReservationQuantities";
import type { ReservationMetaPayload } from "../helpers/releaseRedisReservationHold";
import type { ReservationCachePayload } from "./types";

const CONTEXT = "reserveTickets";

const RESERVE_TICKETS_LUA = `
  local stockKey = KEYS[1]
  local reservationKey = KEYS[2]
  local queueKey = KEYS[3]
  local metaKey = KEYS[4]

  local quantity = tonumber(ARGV[1])
  local payloadJson = ARGV[2]
  local ttlSeconds = tonumber(ARGV[3])
  local metaJson = ARGV[4]
  local metaTtlSeconds = tonumber(ARGV[5])

  local currentStockStr = redis.call("GET", stockKey)
  if not currentStockStr then
    return { err = "STOCK_NOT_INITIALIZED" }
  end

  local currentStock = tonumber(currentStockStr)
  if currentStock < quantity then
    return { 0, currentStock }
  end

  local newStock = currentStock - quantity
  redis.call("SET", stockKey, newStock)
  redis.call("SETEX", reservationKey, ttlSeconds, payloadJson)
  redis.call("SETEX", metaKey, metaTtlSeconds, metaJson)
  redis.call("LPUSH", queueKey, payloadJson)
  return { 1, newStock }
`;

export async function reserveTickets(
  redis: Redis,
  userId: string,
  ticketLotId: string,
  quantity: number,
) {
  const logger = Logger.getInstance();
  const data = validateSchema(reserveTicketsSchema, { userId, ticketLotId, quantity });

  const user = await findOneUserById(data.userId);
  if (!user) {
    throw new ReserveUserNotFoundError(data.userId);
  }

  const pendingOrder = await findPendingOrderByUserId(data.userId);
  if (pendingOrder) {
    throw new PendingOrderExistsError();
  }

  const lot = await findTicketLotForPurchase(data.ticketLotId);
  if (!lot) {
    throw new TicketLotNotFoundError(data.ticketLotId);
  }

  if (lot.eventStatus !== EventStatus.PUBLISHED) {
    throw new EventNotOnSaleError();
  }

  const access = await checkParticipationAccess(data.userId, data.ticketLotId);
  if (access.requiresApproval && !access.allowed) {
    if (access.denialReason === "LOT_NOT_ALLOWED") {
      throw new ParticipationLotNotAllowedError();
    }
    throw new ParticipationNotApprovedError();
  }

  await ensureRedisStockInitialized(
    redis,
    data.ticketLotId,
    lot.availableQuantity,
    logger,
  );

  const reservationId = randomUUID();
  const expiresAt = new Date(Date.now() + RESERVATION_TTL_MS).toISOString();

  const payload: ReservationCachePayload & { expiresAt: string } = {
    reservationId,
    userId: data.userId,
    ticketLotId: data.ticketLotId,
    quantity: data.quantity,
    expiresAt,
  };

  const metaPayload: ReservationMetaPayload = {
    reservationId,
    userId: data.userId,
    ticketLotId: data.ticketLotId,
    quantity: data.quantity,
  };

  const stockKey = `${TICKET_LOT_STOCK_KEY_PREFIX}${data.ticketLotId}`;
  const reservationKey = `${RESERVATION_KEY_PREFIX}${reservationId}`;
  const metaKey = `${RESERVATION_META_KEY_PREFIX}${reservationId}`;
  const metaTtlSeconds = RESERVATION_TTL_SECONDS + RESERVATION_META_GRACE_SECONDS;

  const result = (await redis.eval(
    RESERVE_TICKETS_LUA,
    4,
    stockKey,
    reservationKey,
    RESERVATION_PERSIST_QUEUE_KEY,
    metaKey,
    String(data.quantity),
    JSON.stringify(payload),
    String(RESERVATION_TTL_SECONDS),
    JSON.stringify(metaPayload),
    String(metaTtlSeconds),
  )) as [number, number];

  const [ok, remainingStock] = result;

  if (ok !== 1) {
    throw new InsufficientStockError(remainingStock, data.quantity);
  }

  logger.info(CONTEXT, "Reservation accepted in Redis (async persistence)", {
    reservationId,
    ticketLotId: data.ticketLotId,
    userId: data.userId,
    quantity: data.quantity,
    expiresAt,
    remainingStock,
    reservationKey,
    stockKey,
    queueKey: RESERVATION_PERSIST_QUEUE_KEY,
  });

  return {
    reservationId,
    expiresAt,
    ticketLotId: data.ticketLotId,
    quantity: data.quantity,
    remainingStock,
  };
}

async function ensureRedisStockInitialized(
  redis: Redis,
  ticketLotId: string,
  pgAvailableQuantity: number,
  logger: Logger,
) {
  const stockKey = `${TICKET_LOT_STOCK_KEY_PREFIX}${ticketLotId}`;
  const lockKey = `${LOCK_STOCK_INIT_KEY_PREFIX}${ticketLotId}`;

  if ((await redis.get(stockKey)) !== null) {
    return;
  }

  const lock = await acquireLock(redis, lockKey, 5_000, 12);

  try {
    if ((await redis.get(stockKey)) !== null) {
      return;
    }

    const pendingInQueues = await sumPendingQuantityForLot(redis, ticketLotId);
    const initialStock = Math.max(0, pgAvailableQuantity - pendingInQueues);

    await redis.setnx(stockKey, String(initialStock));

    logger.debug(CONTEXT, "Redis stock initialized (or already set)", {
      ticketLotId,
      stockKey,
      pgAvailableQuantity,
      pendingInQueues,
      initialStock,
    });
  } finally {
    if (lock) {
      await releaseLock(redis, lock);
    }
  }
}
