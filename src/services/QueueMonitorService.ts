import type Redis from "ioredis";
import { RESERVATION_PERSIST_QUEUE_KEY } from "../config/constants";
import { Logger } from "../config/logger";

const CONTEXT = "QueueMonitorService";

export interface QueueStats {
  persistQueueLength: number;
  persistQueueKey: string;
  sampledAt: string;
}

export class QueueMonitorService {
  private readonly logger = Logger.getInstance();

  constructor(private readonly redis: Redis) {}

  async getStats(): Promise<QueueStats> {
    const persistQueueLength = await this.redis.llen(
      RESERVATION_PERSIST_QUEUE_KEY,
    );

    const stats: QueueStats = {
      persistQueueLength,
      persistQueueKey: RESERVATION_PERSIST_QUEUE_KEY,
      sampledAt: new Date().toISOString(),
    };

    this.logger.debug(CONTEXT, "Queue stats sampled", { ...stats });

    return stats;
  }
}
