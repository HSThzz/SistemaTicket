/**
 * @file Worker que consome a fila Redis e persiste reservas no PostgreSQL, criando pedido e PIX.
 * @module sales/infrastructure/workers/ReservationPersistenceWorker
 */

import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import {
  ORDER_CACHE_KEY_PREFIX,
  PAYMENT_CACHE_KEY_PREFIX,
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
import { PaymentService } from "../../../payment/application/PaymentService";

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
   * @param dataSource - Conexão TypeORM para transações de reserva e pedido.
   * @param redis - Cliente Redis da fila principal e caches.
   * @param paymentService - Serviço para gerar cobrança PIX após persistência.
   */
  constructor(
    private readonly dataSource: DataSource,
    private readonly redis: Redis,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Inicia o loop de consumo da fila em background.
   * @returns Promise resolvida assim que o worker estiver marcado como ativo.
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
   * @returns Promise resolvida quando a flag `running` for desligada.
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

  /**
   * Retorna contadores acumulados do worker (processados, falhas, retries, DLQ).
   * @returns Objeto com métricas desde o último `start`.
   */
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
        const payload = JSON.parse(raw) as PersistJobPayload;
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
    const stockKey = `${TICKET_LOT_STOCK_KEY_PREFIX}${payload.ticketLotId}`;

    if (new Date(payload.expiresAt) <= new Date()) {
      await this.compensateRedis(stockKey, reservationKey, payload.quantity);
      this.logger.warn(CONTEXT, "Skipped persistence — reservation already expired", {
        reservationId: payload.reservationId,
        attempt: payload.attempt,
      });
      return;
    }

    const reservationStillActive = await this.redis.exists(reservationKey);
    if (reservationStillActive === 0) {
      await this.compensateRedis(stockKey, reservationKey, payload.quantity);
      this.logger.warn(CONTEXT, "Skipped persistence — reservation key missing in Redis", {
        reservationId: payload.reservationId,
        attempt: payload.attempt,
      });
      return;
    }

    try {
      const result = await persistReservation(this.dataSource, payload);

      let orderId: string | null = null;

      if (result.status === "duplicate") {
        this.logger.warn(CONTEXT, "Reservation already persisted (duplicate job)", {
          reservationId: payload.reservationId,
        });
        orderId = result.orderId;
      } else if (result.status === "lot_not_found") {
        this.logger.error(CONTEXT, "Ticket lot not found during persistence", {
          reservationId: payload.reservationId,
          ticketLotId: payload.ticketLotId,
        });
        await this.compensateRedis(stockKey, reservationKey, payload.quantity);
      } else if (result.status === "negative_stock") {
        this.logger.error(CONTEXT, "DB stock would become negative — compensating Redis", {
          reservationId: payload.reservationId,
          ticketLotId: payload.ticketLotId,
        });
        await this.compensateRedis(stockKey, reservationKey, payload.quantity);
      } else {
        orderId = result.orderId;
        this.logger.info(CONTEXT, "Reservation persisted successfully", {
          reservationId: payload.reservationId,
          orderId: result.orderId,
          ticketLotId: payload.ticketLotId,
          userId: payload.userId,
          quantity: payload.quantity,
        });
      }

      if (!orderId) {
        this.failedCount += 1;
        await this.scheduleRetryOrDlq(payload, "orderId_null");
        return;
      }

      await this.redis.setex(
        `${ORDER_CACHE_KEY_PREFIX}${payload.reservationId}`,
        RESERVATION_TTL_SECONDS,
        orderId,
      );

      await this.createPaymentCache(payload.reservationId, orderId);
      this.processedCount += 1;
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

  private async createPaymentCache(
    reservationId: string,
    orderId: string,
  ): Promise<void> {
    try {
      const payment = await this.paymentService.processOrderPayment(orderId);

      await this.redis.setex(
        `${PAYMENT_CACHE_KEY_PREFIX}${reservationId}`,
        RESERVATION_TTL_SECONDS,
        JSON.stringify(payment),
      );

      this.logger.info(CONTEXT, "PIX payment cached for reservation", {
        reservationId,
        orderId,
        transactionId: payment.transactionId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(CONTEXT, "Failed to create PIX after persistence", {
        reservationId,
        orderId,
        error: message,
      });

      try {
        await this.paymentService.abortPendingOrderAfterPixCreationFailure(
          orderId,
          message,
        );
      } catch (abortError) {
        this.logger.error(CONTEXT, "Failed to abort order after PIX error", {
          reservationId,
          orderId,
          error:
            abortError instanceof Error ? abortError.message : String(abortError),
        });
      }
    }
  }

  private async compensateRedis(
    stockKey: string,
    reservationKey: string,
    quantity: number,
  ): Promise<void> {
    await this.redis.incrby(stockKey, quantity);
    await this.redis.del(reservationKey);
  }

  private computeRetryDelayMs(attempt: number): number {
    const exp = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
    const jitter = Math.floor(Math.random() * 250);
    return Math.min(exp + jitter, RETRY_MAX_DELAY_MS);
  }

  private async scheduleRetryOrDlq(
    payload: PersistJobPayload,
    reason: string,
  ): Promise<void> {
    const attempt = payload.attempt ?? 1;

    if (attempt >= MAX_ATTEMPTS) {
      const dlqPayload = JSON.stringify({ ...payload, attempt, reason });
      await this.redis.lpush(RESERVATION_PERSIST_DLQ_KEY, dlqPayload);
      this.dlqCount += 1;
      this.logger.error(CONTEXT, "Job moved to DLQ", {
        reservationId: payload.reservationId,
        ticketLotId: payload.ticketLotId,
        attempt,
        reason,
        dlqKey: RESERVATION_PERSIST_DLQ_KEY,
      });
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
    const now = Date.now();

    const due = await this.redis.zrangebyscore(
      RESERVATION_PERSIST_RETRY_SCHEDULE_KEY,
      0,
      now,
      "LIMIT",
      0,
      batchSize,
    );

    if (due.length === 0) {
      return;
    }

    const pipeline = this.redis.pipeline();

    for (const item of due) {
      pipeline.zrem(RESERVATION_PERSIST_RETRY_SCHEDULE_KEY, item);
      pipeline.lpush(RESERVATION_PERSIST_RETRY_QUEUE_KEY, item);
    }

    await pipeline.exec();
  }
}
