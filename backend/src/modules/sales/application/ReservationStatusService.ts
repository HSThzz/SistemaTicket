/**
 * @file Agregação do estado de uma reserva entre Redis, fila, pedido e pagamento PIX.
 * @module sales/application/ReservationStatusService
 */

import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import {
  ORDER_CACHE_KEY_PREFIX,
  PAYMENT_CACHE_KEY_PREFIX,
  RESERVATION_KEY_PREFIX,
} from "../../../shared/infrastructure/config/constants";
import { Logger } from "../../../shared/infrastructure/config/logger";
import type { Order } from "../../../shared/infrastructure/persistence/entities/Order";
import type { Reservation } from "../../../shared/infrastructure/persistence/entities/Reservation";
import { findOneOrderById } from "./queries/findOneOrderById";
import { findOneOrderByReservationId } from "./queries/findOneOrderByReservationId";
import { findOneReservationById } from "./queries/findOneReservationById";
import { OrderStatus, ReservationStatus } from "../../../shared/kernel/enums";
import {
  ReservationAccessDeniedError,
  ReservationNotFoundError,
} from "../domain/errors/PurchaseError";
import type { PixPaymentDetails } from "../../payment/application/PaymentService";
import { QueueMonitorService } from "../../../shared/application/QueueMonitorService";

const CONTEXT = "ReservationStatusService";

/**
 * Fase consolidada do ciclo de vida da reserva para polling do cliente.
 */
export type ReservationPhase =
  | "PENDING_PERSISTENCE"
  | "PENDING_PAYMENT"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "EXPIRED"
  | "FAILED"
  | "NOT_FOUND";

/**
 * Visão unificada do status da reserva, pedido, pagamento e metadados operacionais.
 */
export interface ReservationStatusView {
  reservationId: string;
  phase: ReservationPhase;
  reservation: {
    id: string;
    status: ReservationStatus | "PENDING_PERSISTENCE";
    expiresAt: string;
    quantity: number;
    ticketLotId: string;
  } | null;
  order: {
    id: string;
    status: OrderStatus;
    totalPrice: number;
    paymentGatewayId: string | null;
  } | null;
  payment: PixPaymentDetails | null;
  meta: {
    inRedis: boolean;
    persistedToPostgres: boolean;
    queuePendingJobs: number;
  };
}

type ReservationRedisPayload = {
  reservationId: string;
  userId: string;
  ticketLotId: string;
  quantity: number;
  expiresAt: string;
};

/**
 * Consulta estado de reserva cruzando cache Redis, PostgreSQL e fila de persistência.
 */
export class ReservationStatusService {
  private readonly logger = Logger.getInstance();
  private readonly queueMonitor: QueueMonitorService;

  /**
   * @param dataSource - Conexão TypeORM.
   * @param redis - Cliente Redis para caches de reserva, pedido e pagamento.
   */
  constructor(
    private readonly dataSource: DataSource,
    private readonly redis: Redis,
  ) {
    this.queueMonitor = new QueueMonitorService(redis);
  }

  /**
   * Obtém o status consolidado de uma reserva para o comprador.
   * @param reservationId - Identificador da reserva.
   * @param requesterUserId - Usuário autenticado que solicita a consulta.
   * @returns Visão com fase, reserva, pedido, PIX e metadados da fila.
   * @throws {ReservationNotFoundError} Se a reserva não existir em nenhuma camada.
   * @throws {ReservationAccessDeniedError} Se o solicitante não for o dono.
   */
  async getStatus(
    reservationId: string,
    requesterUserId: string,
  ): Promise<ReservationStatusView> {
    const [redisRaw, paymentRaw, orderIdCached, dbReservation, queueStats] =
      await Promise.all([
        this.redis.get(`${RESERVATION_KEY_PREFIX}${reservationId}`),
        this.redis.get(`${PAYMENT_CACHE_KEY_PREFIX}${reservationId}`),
        this.redis.get(`${ORDER_CACHE_KEY_PREFIX}${reservationId}`),
        findOneReservationById(this.dataSource, reservationId),
        this.queueMonitor.getStats(),
      ]);

    const redisPayload = redisRaw
      ? (JSON.parse(redisRaw) as ReservationRedisPayload)
      : null;

    const payment = paymentRaw
      ? (JSON.parse(paymentRaw) as PixPaymentDetails)
      : null;

    if (!redisPayload && !dbReservation) {
      throw new ReservationNotFoundError(reservationId);
    }

    const ownerId = redisPayload?.userId ?? dbReservation?.userId;
    if (!ownerId || ownerId !== requesterUserId) {
      throw new ReservationAccessDeniedError();
    }

    let order: Order | null = null;
    if (dbReservation) {
      order = await findOneOrderByReservationId(this.dataSource, reservationId);
    } else if (orderIdCached) {
      order = await findOneOrderById(this.dataSource, orderIdCached);
    }

    const phase = this.resolvePhase(dbReservation, order, payment, redisPayload);

    this.logger.info(CONTEXT, "Reservation status queried", {
      reservationId,
      phase,
      requesterUserId,
      queuePendingJobs: queueStats.persistQueueLength,
    });

    return {
      reservationId,
      phase,
      reservation: this.buildReservationView(dbReservation, redisPayload),
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

  private resolvePhase(
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

  private buildReservationView(
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
}
