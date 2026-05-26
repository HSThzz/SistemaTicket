import type Redis from "ioredis";
import {
  RESERVATION_PERSIST_DLQ_KEY,
  RESERVATION_PERSIST_QUEUE_KEY,
  RESERVATION_PERSIST_RETRY_QUEUE_KEY,
  RESERVATION_PERSIST_RETRY_SCHEDULE_KEY,
} from "../config/constants";
import { Logger } from "../config/logger";

const CONTEXT = "QueueMonitorService";

export interface QueueStats {
  persistQueueLength: number;
  persistQueueKey: string;
  retryQueueLength: number;
  retryQueueKey: string;
  dlqLength: number;
  dlqKey: string;
  retryScheduled: number;
  retryScheduleKey: string;
  sampledAt: string;
}

export class QueueMonitorService {
  private readonly logger = Logger.getInstance();

  constructor(private readonly redis: Redis) {}

  async getStats(): Promise<QueueStats> {
    const [
      persistQueueLength,
      retryQueueLength,
      dlqLength,
      retryScheduled,
    ] = await Promise.all([
      this.redis.llen(RESERVATION_PERSIST_QUEUE_KEY),
      this.redis.llen(RESERVATION_PERSIST_RETRY_QUEUE_KEY),
      this.redis.llen(RESERVATION_PERSIST_DLQ_KEY),
      this.redis.zcard(RESERVATION_PERSIST_RETRY_SCHEDULE_KEY),
    ]);

    const stats: QueueStats = {
      persistQueueLength,
      persistQueueKey: RESERVATION_PERSIST_QUEUE_KEY,
      retryQueueLength,
      retryQueueKey: RESERVATION_PERSIST_RETRY_QUEUE_KEY,
      dlqLength,
      dlqKey: RESERVATION_PERSIST_DLQ_KEY,
      retryScheduled,
      retryScheduleKey: RESERVATION_PERSIST_RETRY_SCHEDULE_KEY,
      sampledAt: new Date().toISOString(),
    };

    this.logger.debug(CONTEXT, "Queue stats sampled", { ...stats });

    return stats;
  }
}
