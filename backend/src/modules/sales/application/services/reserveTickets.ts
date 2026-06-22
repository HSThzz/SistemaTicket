import type Redis from "ioredis";
import { randomUUID } from "node:crypto";
import {
  LOCK_STOCK_INIT_KEY_PREFIX,
  RESERVATION_KEY_PREFIX,
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
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import {
  InsufficientStockError,
  ParticipationNotApprovedError,
  ReserveUserNotFoundError,
  TicketLotNotFoundError,
} from "../../domain/errors/PurchaseError";
import { reserveTicketsSchema } from "../../validators/schema/reserveTicketsSchema";
import { findOneTicketLotById } from "../queries/findOneTicketLotById";
import { findOneUserById } from "../../../identity/application/queries/findOneUserById";
import { checkParticipationAccess } from "../../../participation/application/services/checkParticipationAccess";
import type { ReservationCachePayload } from "./types";

const CONTEXT = "reserveTickets";

const RESERVE_TICKETS_LUA = `
  local stockKey = KEYS[1]
  local reservationKey = KEYS[2]
  local queueKey = KEYS[3]

  local quantity = tonumber(ARGV[1])
  local payloadJson = ARGV[2]
  local ttlSeconds = tonumber(ARGV[3])

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

  const access = await checkParticipationAccess(data.userId, data.ticketLotId);
  if (access.requiresApproval && !access.allowed) {
    throw new ParticipationNotApprovedError();
  }

  await ensureRedisStockInitialized(redis, data.ticketLotId, logger);

  const reservationId = randomUUID();
  const expiresAt = new Date(Date.now() + RESERVATION_TTL_MS).toISOString();

  const payload: ReservationCachePayload & { expiresAt: string } = {
    reservationId,
    userId: data.userId,
    ticketLotId: data.ticketLotId,
    quantity: data.quantity,
    expiresAt,
  };

  const stockKey = `${TICKET_LOT_STOCK_KEY_PREFIX}${data.ticketLotId}`;
  const reservationKey = `${RESERVATION_KEY_PREFIX}${reservationId}`;

  const result = (await redis.eval(
    RESERVE_TICKETS_LUA,
    3,
    stockKey,
    reservationKey,
    RESERVATION_PERSIST_QUEUE_KEY,
    String(data.quantity),
    JSON.stringify(payload),
    String(RESERVATION_TTL_SECONDS),
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

    const lot = await findOneTicketLotById(ticketLotId);
    if (!lot) {
      throw new TicketLotNotFoundError(ticketLotId);
    }

    await redis.setnx(stockKey, String(lot.availableQuantity));

    logger.debug(CONTEXT, "Redis stock initialized (or already set)", {
      ticketLotId,
      stockKey,
      availableQuantity: lot.availableQuantity,
    });
  } finally {
    if (lock) {
      await releaseLock(redis, lock);
    }
  }
}
