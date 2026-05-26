import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import {
  ORDER_CACHE_KEY_PREFIX,
  PAYMENT_CACHE_KEY_PREFIX,
  RESERVATION_KEY_PREFIX,
  RESERVATION_PERSIST_QUEUE_KEY,
  RESERVATION_TTL_SECONDS,
  TICKET_LOT_STOCK_KEY_PREFIX,
} from "../config/constants";
import { Logger } from "../config/logger";
import { Order } from "../entities/Order";
import { Reservation } from "../entities/Reservation";
import { TicketLot } from "../entities/TicketLot";
import { OrderStatus, ReservationStatus } from "../entities/enums";
import { PaymentService } from "../services/PaymentService";

const CONTEXT = "ReservationPersistenceWorker";

type PersistJobPayload = {
  reservationId: string;
  userId: string;
  ticketLotId: string;
  quantity: number;
  expiresAt: string;
};

export class ReservationPersistenceWorker {
  private readonly logger = Logger.getInstance();
  private running = false;
  private processedCount = 0;
  private failedCount = 0;

  constructor(
    private readonly dataSource: DataSource,
    private readonly redis: Redis,
    private readonly paymentService: PaymentService,
  ) {}

  async start(): Promise<void> {
    this.running = true;
    this.logger.info(CONTEXT, "Worker started", {
      queueKey: RESERVATION_PERSIST_QUEUE_KEY,
    });
    void this.loop();
  }

  async stop(): Promise<void> {
    this.running = false;
    this.logger.info(CONTEXT, "Worker stopping", {
      processedCount: this.processedCount,
      failedCount: this.failedCount,
    });
  }

  getMetrics(): { processedCount: number; failedCount: number } {
    return {
      processedCount: this.processedCount,
      failedCount: this.failedCount,
    };
  }

  private async loop(): Promise<void> {
    while (this.running) {
      try {
        const queueDepth = await this.redis.llen(RESERVATION_PERSIST_QUEUE_KEY);

        const result = await this.redis.brpop(
          RESERVATION_PERSIST_QUEUE_KEY,
          2,
        );

        if (!result) {
          continue;
        }

        const [, raw] = result;
        const payload = JSON.parse(raw) as PersistJobPayload;

        this.logger.debug(CONTEXT, "Job dequeued", {
          reservationId: payload.reservationId,
          queueDepthBefore: queueDepth,
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
      });
      return;
    }

    const reservationStillActive = await this.redis.exists(reservationKey);
    if (reservationStillActive === 0) {
      await this.compensateRedis(stockKey, reservationKey, payload.quantity);
      this.logger.warn(CONTEXT, "Skipped persistence — reservation key missing in Redis", {
        reservationId: payload.reservationId,
      });
      return;
    }

    try {
      const orderId = await this.dataSource.transaction(async (manager) => {
        const existing = await manager.findOne(Reservation, {
          where: { id: payload.reservationId },
        });

        if (existing) {
          this.logger.warn(CONTEXT, "Reservation already persisted (duplicate job)", {
            reservationId: payload.reservationId,
          });

          const existingOrder = await manager.findOne(Order, {
            where: { reservationId: payload.reservationId },
          });
          return existingOrder?.id ?? null;
        }

        const lot = await manager.findOne(TicketLot, {
          where: { id: payload.ticketLotId },
          lock: { mode: "pessimistic_write" },
        });

        if (!lot) {
          this.logger.error(CONTEXT, "Ticket lot not found during persistence", {
            reservationId: payload.reservationId,
            ticketLotId: payload.ticketLotId,
          });
          await this.compensateRedis(stockKey, reservationKey, payload.quantity);
          return null;
        }

        lot.availableQuantity -= payload.quantity;
        if (lot.availableQuantity < 0) {
          this.logger.error(CONTEXT, "DB stock would become negative — compensating Redis", {
            reservationId: payload.reservationId,
            ticketLotId: payload.ticketLotId,
            dbAvailableAfter: lot.availableQuantity,
          });
          await this.compensateRedis(stockKey, reservationKey, payload.quantity);
          return null;
        }

        await manager.save(lot);

        const reservation = manager.create(Reservation, {
          id: payload.reservationId,
          userId: payload.userId,
          ticketLotId: payload.ticketLotId,
          quantity: payload.quantity,
          status: ReservationStatus.PENDING,
          expiresAt: new Date(payload.expiresAt),
        });
        await manager.save(reservation);

        const order = manager.create(Order, {
          userId: payload.userId,
          reservationId: payload.reservationId,
          totalPrice: lot.price * payload.quantity,
          status: OrderStatus.PENDING,
          paymentGatewayId: null,
        });
        await manager.save(order);

        this.logger.info(CONTEXT, "Reservation persisted successfully", {
          reservationId: payload.reservationId,
          orderId: order.id,
          ticketLotId: payload.ticketLotId,
          userId: payload.userId,
          quantity: payload.quantity,
        });

        return order.id;
      });

      if (!orderId) {
        this.failedCount += 1;
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
        error: error instanceof Error ? error.message : String(error),
        failedCount: this.failedCount,
      });
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
      this.logger.error(CONTEXT, "Failed to create PIX after persistence", {
        reservationId,
        orderId,
        error: error instanceof Error ? error.message : String(error),
      });
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
}
