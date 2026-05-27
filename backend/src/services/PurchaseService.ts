import type Redis from "ioredis";
import { randomUUID } from "node:crypto";
import type { DataSource } from "typeorm";
import {
  RESERVATION_KEY_PREFIX,
  RESERVATION_TTL_MS,
  RESERVATION_TTL_SECONDS,
  RESERVATION_PERSIST_QUEUE_KEY,
  TICKET_LOT_STOCK_KEY_PREFIX,
} from "../config/constants";
import { Logger } from "../config/logger";
import {
  InsufficientStockError,
  InvalidQuantityError,
  TicketLotNotFoundError,
} from "../errors/PurchaseError";
import { TicketLot } from "../entities/TicketLot";

const CONTEXT = "PurchaseService";

export interface ReservationCachePayload {
  reservationId: string;
  userId: string;
  ticketLotId: string;
  quantity: number;
}

export interface ReserveTicketsResult {
  reservationId: string;
  expiresAt: string;
  ticketLotId: string;
  quantity: number;
  remainingStock: number;
}

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

export class PurchaseService {
  private readonly logger = Logger.getInstance();

  constructor(
    private readonly dataSource: DataSource,
    private readonly redis: Redis,
  ) {}

  async reserveTickets(
    userId: string,
    ticketLotId: string,
    quantity: number,
  ): Promise<ReserveTicketsResult> {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new InvalidQuantityError(quantity);
    }

    await this.ensureRedisStockInitialized(ticketLotId);

    const reservationId = randomUUID();
    const expiresAt = new Date(Date.now() + RESERVATION_TTL_MS).toISOString();

    const payload: ReservationCachePayload & { expiresAt: string } = {
      reservationId,
      userId,
      ticketLotId,
      quantity,
      expiresAt,
    };

    const stockKey = `${TICKET_LOT_STOCK_KEY_PREFIX}${ticketLotId}`;
    const reservationKey = `${RESERVATION_KEY_PREFIX}${reservationId}`;

    const result = (await this.redis.eval(
      RESERVE_TICKETS_LUA,
      3,
      stockKey,
      reservationKey,
      RESERVATION_PERSIST_QUEUE_KEY,
      String(quantity),
      JSON.stringify(payload),
      String(RESERVATION_TTL_SECONDS),
    )) as [number, number];

    const [ok, remainingStock] = result;

    if (ok !== 1) {
      throw new InsufficientStockError(remainingStock, quantity);
    }

    this.logger.info(CONTEXT, "Reservation accepted in Redis (async persistence)", {
      reservationId,
      ticketLotId,
      userId,
      quantity,
      expiresAt,
      remainingStock,
      reservationKey,
      stockKey,
      queueKey: RESERVATION_PERSIST_QUEUE_KEY,
    });

    return {
      reservationId,
      expiresAt,
      ticketLotId,
      quantity,
      remainingStock,
    };
  }

  private async ensureRedisStockInitialized(ticketLotId: string): Promise<void> {
    const stockKey = `${TICKET_LOT_STOCK_KEY_PREFIX}${ticketLotId}`;

    const existing = await this.redis.get(stockKey);
    if (existing !== null) {
      return;
    }

    const lot = await this.dataSource.getRepository(TicketLot).findOne({
      where: { id: ticketLotId },
      select: { id: true, availableQuantity: true },
    });

    if (!lot) {
      throw new TicketLotNotFoundError(ticketLotId);
    }

    // SETNX evita “pisar” num valor já inicializado por outra requisição concorrente.
    await this.redis.setnx(stockKey, String(lot.availableQuantity));

    this.logger.debug(CONTEXT, "Redis stock initialized (or already set)", {
      ticketLotId,
      stockKey,
      availableQuantity: lot.availableQuantity,
    });
  }
}
