/**
 * @file Worker que consome a fila Redis e persiste reservas no PostgreSQL, criando o pedido.
 * @module sales/infrastructure/workers/ReservationPersistenceWorker
 */

import type Redis from "ioredis";
import {
  ORDER_CACHE_KEY_PREFIX,
  RESERVATION_KEY_PREFIX,
  RESERVATION_PERSIST_DLQ_KEY,
  RESERVATION_PERSIST_QUEUE_KEY,
  RESERVATION_PERSIST_RETRY_QUEUE_KEY,
  RESERVATION_PERSIST_RETRY_SCHEDULE_KEY,
  RESERVATION_TTL_SECONDS,
  TICKET_LOT_STOCK_KEY_PREFIX,
} from "../../../../shared/infrastructure/config/constants";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { persistReservation } from "../../application/commands/persistReservation";
import {
  clearReservationMeta,
  releaseRedisReservationHold,
} from "../../application/helpers/releaseRedisReservationHold";

const CONTEXT = "ReservationPersistenceWorker";

type PersistJobPayload = {
  reservationId: string;
  userId: string;
  ticketLotId: string;
  quantity: number;
  expiresAt: string;
  attempt?: number;
};

const MAX_ATTEMPTS = 5;
const RETRY_BASE_DELAY_MS = 500;
const RETRY_MAX_DELAY_MS = 20_000;

const DRAIN_RETRY_SCHEDULE_LUA = `
  local scheduleKey = KEYS[1]
  local retryQueueKey = KEYS[2]
  local now = tonumber(ARGV[1])
  local batchSize = tonumber(ARGV[2])

  local due = redis.call("ZRANGEBYSCORE", scheduleKey, 0, now, "LIMIT", 0, batchSize)
  for _, item in ipairs(due) do
    redis.call("ZREM", scheduleKey, item)
    redis.call("LPUSH", retryQueueKey, item)
  end
  return #due
`;

/**
 * Processa jobs de persistência de reserva com retentativas exponenciais e DLQ.
 */
export class ReservationPersistenceWorker {
  private readonly logger = Logger.getInstance();
  private running = false;
  private processedCount = 0;
  private failedCount = 0;
  private retryScheduledCount = 0;
  private dlqCount = 0;

  /**
   * @param redis - Cliente Redis da fila principal e caches.
   */
  constructor(private readonly redis: Redis) {}

  /**
   * Inicia o loop de consumo da fila em background.
   */
  async start(): Promise<void> {
    this.running = true;
    this.logger.info(CONTEXT, "Worker started", {
      queueKey: RESERVATION_PERSIST_QUEUE_KEY,
    });
    void this.loop();
  }

  /**
   * Sinaliza parada do loop e registra métricas finais.
   */
  async stop(): Promise<void> {
    this.running = false;
    this.logger.info(CONTEXT, "Worker stopping", {
      processedCount: this.processedCount,
      failedCount: this.failedCount,
      retryScheduledCount: this.retryScheduledCount,
      dlqCount: this.dlqCount,
    });
  }

  getMetrics(): {
    processedCount: number;
    failedCount: number;
    retryScheduledCount: number;
    dlqCount: number;
  } {
    return {
      processedCount: this.processedCount,
      failedCount: this.failedCount,
      retryScheduledCount: this.retryScheduledCount,
      dlqCount: this.dlqCount,
    };
  }

  private async loop(): Promise<void> {
    while (this.running) {
      try {
        await this.drainRetrySchedule();

        const queueDepth = await this.redis.llen(RESERVATION_PERSIST_QUEUE_KEY);

        const result = await this.redis.brpop([
          RESERVATION_PERSIST_QUEUE_KEY,
          RESERVATION_PERSIST_RETRY_QUEUE_KEY,
        ], 2);

        if (!result) {
          continue;
        }

        const [, raw] = result;
        let payload: PersistJobPayload;

        try {
          payload = JSON.parse(raw) as PersistJobPayload;
        } catch {
          this.failedCount += 1;
          await this.redis.lpush(
            RESERVATION_PERSIST_DLQ_KEY,
            JSON.stringify({ raw, reason: "invalid_json" }),
          );
          this.dlqCount += 1;
          this.logger.error(CONTEXT, "Invalid JSON job moved to DLQ", {
            dlqKey: RESERVATION_PERSIST_DLQ_KEY,
          });
          continue;
        }

        if (
          !payload.reservationId ||
          !payload.ticketLotId ||
          !payload.userId ||
          !payload.expiresAt ||
          typeof payload.quantity !== "number"
        ) {
          this.failedCount += 1;
          await this.moveToDlq(payload, "invalid_payload");
          continue;
        }

        payload.attempt = payload.attempt ?? 1;

        this.logger.debug(CONTEXT, "Job dequeued", {
          reservationId: payload.reservationId,
          queueDepthBefore: queueDepth,
          attempt: payload.attempt,
        });

        await this.persist(payload);
      } catch (error) {
        this.failedCount += 1;
        this.logger.error(CONTEXT, "Worker loop error", {
          error: error instanceof Error ? error.message : String(error),
          failedCount: this.failedCount,
        });
      }
    }
  }

  private async persist(payload: PersistJobPayload): Promise<void> {
    const reservationKey = `${RESERVATION_KEY_PREFIX}${payload.reservationId}`;

    if (new Date(payload.expiresAt) <= new Date()) {
      await this.compensateRedis(payload);
      this.logger.warn(CONTEXT, "Skipped persistence — reservation already expired", {
        reservationId: payload.reservationId,
        attempt: payload.attempt,
      });
      return;
    }

    const reservationStillActive = await this.redis.exists(reservationKey);
    if (reservationStillActive === 0) {
      await this.compensateRedis(payload);
      this.logger.warn(CONTEXT, "Skipped persistence — reservation key missing in Redis", {
        reservationId: payload.reservationId,
        attempt: payload.attempt,
      });
      return;
    }

    try {
      const result = await persistReservation(payload);

      if (result.status === "duplicate") {
        this.logger.warn(CONTEXT, "Reservation already persisted (duplicate job)", {
          reservationId: payload.reservationId,
        });

        if (!result.orderId) {
          await clearReservationMeta(this.redis, payload.reservationId);
          await this.moveToDlq(payload, "duplicate_without_order");
          return;
        }

        await this.markOrderReady(payload, result.orderId);
        return;
      }

      if (result.status === "lot_not_found") {
        this.logger.error(CONTEXT, "Ticket lot not found during persistence", {
          reservationId: payload.reservationId,
          ticketLotId: payload.ticketLotId,
        });
        await this.compensateRedis(payload);
        await this.moveToDlq(payload, "lot_not_found");
        return;
      }

      if (result.status === "negative_stock") {
        this.logger.error(CONTEXT, "DB stock would become negative — compensating Redis", {
          reservationId: payload.reservationId,
          ticketLotId: payload.ticketLotId,
        });
        await this.compensateRedis(payload);
        await this.moveToDlq(payload, "negative_stock");
        return;
      }

      if (result.status === "user_not_found") {
        this.logger.error(CONTEXT, "User not found during persistence — compensating Redis", {
          reservationId: payload.reservationId,
          userId: payload.userId,
        });
        await this.compensateRedis(payload);
        await this.moveToDlq(payload, "user_not_found");
        return;
      }

      this.logger.info(CONTEXT, "Reservation persisted successfully", {
        reservationId: payload.reservationId,
        orderId: result.orderId,
        ticketLotId: payload.ticketLotId,
        userId: payload.userId,
        quantity: payload.quantity,
      });

      await this.markOrderReady(payload, result.orderId);
    } catch (error) {
      this.failedCount += 1;
      this.logger.error(CONTEXT, "Failed to persist reservation", {
        reservationId: payload.reservationId,
        ticketLotId: payload.ticketLotId,
        userId: payload.userId,
        attempt: payload.attempt,
        error: error instanceof Error ? error.message : String(error),
        failedCount: this.failedCount,
      });

      await this.scheduleRetryOrDlq(
        payload,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async markOrderReady(
    payload: PersistJobPayload,
    orderId: string,
  ): Promise<void> {
    await clearReservationMeta(this.redis, payload.reservationId);

    await this.redis.setex(
      `${ORDER_CACHE_KEY_PREFIX}${payload.reservationId}`,
      RESERVATION_TTL_SECONDS,
      orderId,
    );

    this.logger.info(CONTEXT, "Order ready for payment", {
      reservationId: payload.reservationId,
      orderId,
    });

    this.processedCount += 1;
  }

  private async compensateRedis(payload: PersistJobPayload): Promise<void> {
    const released = await releaseRedisReservationHold(
      this.redis,
      payload.reservationId,
      {
        ticketLotId: payload.ticketLotId,
        quantity: payload.quantity,
      },
    );

    this.logger.info(CONTEXT, "Redis reservation hold release attempted", {
      reservationId: payload.reservationId,
      ticketLotId: payload.ticketLotId,
      quantity: payload.quantity,
      released,
      stockKey: `${TICKET_LOT_STOCK_KEY_PREFIX}${payload.ticketLotId}`,
    });
  }

  private computeRetryDelayMs(attempt: number): number {
    const exp = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
    const jitter = Math.floor(Math.random() * 250);
    return Math.min(exp + jitter, RETRY_MAX_DELAY_MS);
  }

  private async moveToDlq(
    payload: PersistJobPayload | Record<string, unknown>,
    reason: string,
  ): Promise<void> {
    const dlqPayload = JSON.stringify({ ...payload, reason });
    await this.redis.lpush(RESERVATION_PERSIST_DLQ_KEY, dlqPayload);
    this.dlqCount += 1;
    this.failedCount += 1;
    this.logger.error(CONTEXT, "Job moved to DLQ", {
      reservationId:
        typeof payload.reservationId === "string"
          ? payload.reservationId
          : undefined,
      reason,
      dlqKey: RESERVATION_PERSIST_DLQ_KEY,
    });
  }

  private async scheduleRetryOrDlq(
    payload: PersistJobPayload,
    reason: string,
  ): Promise<void> {
    const attempt = payload.attempt ?? 1;

    if (attempt >= MAX_ATTEMPTS) {
      await this.moveToDlq({ ...payload, attempt }, reason);
      return;
    }

    const nextAttempt = attempt + 1;
    const delayMs = this.computeRetryDelayMs(attempt);
    const dueAtMs = Date.now() + delayMs;

    const retryPayload = JSON.stringify({
      ...payload,
      attempt: nextAttempt,
      reason,
      dueAtMs,
    });

    await this.redis.zadd(RESERVATION_PERSIST_RETRY_SCHEDULE_KEY, dueAtMs, retryPayload);
    this.retryScheduledCount += 1;

    this.logger.warn(CONTEXT, "Job scheduled for retry", {
      reservationId: payload.reservationId,
      ticketLotId: payload.ticketLotId,
      attempt: nextAttempt,
      dueAtMs,
      delayMs,
      scheduleKey: RESERVATION_PERSIST_RETRY_SCHEDULE_KEY,
    });
  }

  private async drainRetrySchedule(batchSize = 50): Promise<void> {
    await this.redis.eval(
      DRAIN_RETRY_SCHEDULE_LUA,
      2,
      RESERVATION_PERSIST_RETRY_SCHEDULE_KEY,
      RESERVATION_PERSIST_RETRY_QUEUE_KEY,
      String(Date.now()),
      String(batchSize),
    );
  }
}
