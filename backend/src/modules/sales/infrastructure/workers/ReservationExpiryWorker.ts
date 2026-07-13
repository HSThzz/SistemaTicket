/**
 * @file Worker que escuta expiração de chaves Redis de reserva e libera pedidos não pagos.
 * @module sales/infrastructure/workers/ReservationExpiryWorker
 */

import type Redis from "ioredis";
import { RESERVATION_KEY_PREFIX } from "../../../../shared/infrastructure/config/constants";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { env } from "../../../../shared/infrastructure/config/env";
import {
  enableKeyspaceNotifications,
  getRedisKeyspaceExpiredPattern,
  getRedisSubscriber,
} from "../../../../shared/infrastructure/config/redis";
import { expireUnpaidOrderByReservationId } from "../../../payment/application/services/expireUnpaidOrderByReservationId";

const CONTEXT = "ReservationExpiryWorker";

/**
 * Reage a eventos `expired` do Redis para reservas com TTL esgotado.
 */
export class ReservationExpiryWorker {
  private readonly logger = Logger.getInstance();
  private readonly expiredKeyPattern = getRedisKeyspaceExpiredPattern();
  private subscriber: Redis | null = null;

  /**
   *    * @param redis - Cliente Redis principal.
   */
  constructor(private readonly redis: Redis) {}

  /**
   * Habilita notificações de keyspace e inscreve no padrão de chaves expiradas.
   * @returns Promise resolvida após a assinatura estar ativa.
   */
  async start(): Promise<void> {
    try {
      await enableKeyspaceNotifications(this.redis);
    } catch (error) {
      this.logger.error(CONTEXT, "Keyspace notifications unavailable — expiry listener disabled", {
        error: error instanceof Error ? error.message : String(error),
        hint: "Configure notify-keyspace-events=Ex on Redis, or rely on stock reconciliation",
      });
      throw error;
    }

    this.subscriber = getRedisSubscriber();
    await this.subscriber.psubscribe(this.expiredKeyPattern);

    this.subscriber.on("pmessage", (_pattern, _channel, expiredKey) => {
      void this.onKeyExpired(expiredKey);
    });

    this.logger.info(CONTEXT, "Listening for expired reservation keys", {
      pattern: this.expiredKeyPattern,
      redisDb: env.redis.db,
      keyPrefix: RESERVATION_KEY_PREFIX,
    });
  }

  /** Indica se o listener de keyspace está ativo. */
  isRunning(): boolean {
    return this.subscriber !== null;
  }

  /** Padrão Redis usado na assinatura de expiração. */
  getListenPattern(): string {
    return this.expiredKeyPattern;
  }

  /**
   * Cancela a assinatura Redis e remove listeners.
   * @returns Promise resolvida após desinscrição (no-op se já parado).
   */
  async stop(): Promise<void> {
    if (!this.subscriber) {
      return;
    }

    await this.subscriber.punsubscribe(this.expiredKeyPattern);
    this.subscriber.removeAllListeners("pmessage");
    this.subscriber = null;

    this.logger.info(CONTEXT, "Stopped reservation expiry listener");
  }

  private async onKeyExpired(key: string): Promise<void> {
    if (!key.startsWith(RESERVATION_KEY_PREFIX)) {
      return;
    }

    const reservationId = key.slice(RESERVATION_KEY_PREFIX.length);

    this.logger.info(CONTEXT, "Reservation TTL expired in Redis", {
      reservationId,
      redisKey: key,
    });

    await this.expireReservation(reservationId);
  }

  /**
   * Expira pedido/reserva associados e restaura estoque.
   * @param reservationId - Identificador da reserva cujo TTL Redis expirou.
   * @returns Promise resolvida após processamento.
   * @throws Propaga erros em falha de persistência.
   */
  async expireReservation(reservationId: string): Promise<void> {
    try {
      await expireUnpaidOrderByReservationId(this.redis,
        reservationId,
      );
    } catch (error) {
      this.logger.error(CONTEXT, "Failed to process reservation expiry", {
        reservationId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
