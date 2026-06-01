/**
 * @file Worker que escuta expiração de chaves Redis de reserva e libera pedidos não pagos.
 * @module sales/infrastructure/workers/ReservationExpiryWorker
 */

import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import { RESERVATION_KEY_PREFIX } from "../../../../shared/infrastructure/config/constants";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import {
  enableKeyspaceNotifications,
  getRedisSubscriber,
} from "../../../../shared/infrastructure/config/redis";
import { PaymentService } from "../../../payment/application/PaymentService";

const CONTEXT = "ReservationExpiryWorker";
const EXPIRED_KEY_PATTERN = "__keyevent@0__:expired";

/**
 * Reage a eventos `expired` do Redis para reservas com TTL esgotado.
 */
export class ReservationExpiryWorker {
  private readonly logger = Logger.getInstance();
  private readonly paymentService: PaymentService;
  private subscriber: Redis | null = null;

  /**
   * @param dataSource - Conexão TypeORM usada pelo {@link PaymentService}.
   * @param redis - Cliente Redis principal.
   * @param paymentService - Serviço de pagamento opcional (padrão: instância interna).
   */
  constructor(
    dataSource: DataSource,
    private readonly redis: Redis,
    paymentService?: PaymentService,
  ) {
    this.paymentService =
      paymentService ?? new PaymentService(dataSource, redis);
  }

  /**
   * Habilita notificações de keyspace e inscreve no padrão de chaves expiradas.
   * @returns Promise resolvida após a assinatura estar ativa.
   */
  async start(): Promise<void> {
    await enableKeyspaceNotifications(this.redis);

    this.subscriber = getRedisSubscriber();
    await this.subscriber.psubscribe(EXPIRED_KEY_PATTERN);

    this.subscriber.on("pmessage", (_pattern, _channel, expiredKey) => {
      void this.onKeyExpired(expiredKey);
    });

    this.logger.info(CONTEXT, "Listening for expired reservation keys", {
      pattern: EXPIRED_KEY_PATTERN,
      keyPrefix: RESERVATION_KEY_PREFIX,
    });
  }

  /**
   * Cancela a assinatura Redis e remove listeners.
   * @returns Promise resolvida após desinscrição (no-op se já parado).
   */
  async stop(): Promise<void> {
    if (!this.subscriber) {
      return;
    }

    await this.subscriber.punsubscribe(EXPIRED_KEY_PATTERN);
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
   * Expira pedido/reserva associados e restaura estoque (via {@link PaymentService}).
   * @param reservationId - Identificador da reserva cujo TTL Redis expirou.
   * @returns Promise resolvida após processamento.
   * @throws Propaga erros do serviço de pagamento em falha de persistência.
   */
  async expireReservation(reservationId: string): Promise<void> {
    try {
      await this.paymentService.expireUnpaidOrderByReservationId(reservationId);
    } catch (error) {
      this.logger.error(CONTEXT, "Failed to process reservation expiry", {
        reservationId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
