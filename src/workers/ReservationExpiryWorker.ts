import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import {
  RESERVATION_KEY_PREFIX,
  TICKET_LOT_STOCK_KEY_PREFIX,
} from "../config/constants";
import { Logger } from "../config/logger";
import {
  enableKeyspaceNotifications,
  getRedisSubscriber,
} from "../config/redis";
import { Reservation } from "../entities/Reservation";
import { TicketLot } from "../entities/TicketLot";
import { ReservationStatus } from "../entities/enums";

const CONTEXT = "ReservationExpiryWorker";
const EXPIRED_KEY_PATTERN = "__keyevent@0__:expired";

export class ReservationExpiryWorker {
  private readonly logger = Logger.getInstance();
  private subscriber: Redis | null = null;

  constructor(
    private readonly dataSource: DataSource,
    private readonly redis: Redis,
  ) {}

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

  async expireReservation(reservationId: string): Promise<void> {
    try {
      await this.dataSource.transaction(async (manager) => {
        const reservation = await manager.findOne(Reservation, {
          where: { id: reservationId },
          lock: { mode: "pessimistic_write" },
        });

        if (!reservation) {
          this.logger.warn(
            CONTEXT,
            "Reservation not found on expiry (likely not persisted yet)",
            { reservationId },
          );
          return;
        }

        if (reservation.status !== ReservationStatus.PENDING) {
          this.logger.info(
            CONTEXT,
            "Skipping expiry — reservation is no longer pending",
            {
              reservationId,
              status: reservation.status,
            },
          );
          return;
        }

        reservation.status = ReservationStatus.EXPIRED;
        await manager.save(reservation);

        const ticketLot = await manager.findOne(TicketLot, {
          where: { id: reservation.ticketLotId },
          lock: { mode: "pessimistic_write" },
        });

        if (!ticketLot) {
          this.logger.error(CONTEXT, "Ticket lot not found when restoring stock", {
            reservationId,
            ticketLotId: reservation.ticketLotId,
          });
          return;
        }

        ticketLot.availableQuantity += reservation.quantity;
        await manager.save(ticketLot);

        const stockKey = `${TICKET_LOT_STOCK_KEY_PREFIX}${reservation.ticketLotId}`;
        await this.redis.incrby(stockKey, reservation.quantity);

        this.logger.info(CONTEXT, "Reservation expired and stock restored", {
          reservationId,
          ticketLotId: ticketLot.id,
          quantity: reservation.quantity,
          availableQuantity: ticketLot.availableQuantity,
          redisStockKey: stockKey,
        });
      });
    } catch (error) {
      this.logger.error(CONTEXT, "Failed to process reservation expiry", {
        reservationId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
