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

export class ReservationExpiryWorker {
  private readonly logger = Logger.getInstance();
  private readonly paymentService: PaymentService;
  private subscriber: Redis | null = null;

  constructor(
    dataSource: DataSource,
    private readonly redis: Redis,
    paymentService?: PaymentService,
  ) {
    this.paymentService =
      paymentService ?? new PaymentService(dataSource, redis);
  }

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
