import type Redis from "ioredis";
import {
  RESERVATION_PERSIST_DLQ_KEY,
  RESERVATION_PERSIST_QUEUE_KEY,
  RESERVATION_PERSIST_RETRY_QUEUE_KEY,
  RESERVATION_PERSIST_RETRY_SCHEDULE_KEY,
} from "../infrastructure/config/constants";
import { Logger } from "../infrastructure/config/logger";

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

export interface RetryScheduleItem {
  dueAtMs: number;
  dueAt: string;
  overdue: boolean;
  overdueByMs: number | null;
  reservationId: string | null;
  ticketLotId: string | null;
  userId: string | null;
  attempt: number | null;
  reason: string | null;
}

export interface RetryScheduleView {
  scheduleKey: string;
  total: number;
  overdueCount: number;
  dueWithin60sCount: number;
  items: RetryScheduleItem[];
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

  async getRetrySchedule(limit = 20): Promise<RetryScheduleView> {
    const now = Date.now();
    const safeLimit = Math.max(1, Math.min(200, limit));

    const [total, overdueCount, dueWithin60sCount, rawEntries] = await Promise.all([
      this.redis.zcard(RESERVATION_PERSIST_RETRY_SCHEDULE_KEY),
      this.redis.zcount(RESERVATION_PERSIST_RETRY_SCHEDULE_KEY, 0, now),
      this.redis.zcount(RESERVATION_PERSIST_RETRY_SCHEDULE_KEY, now, now + 60_000),
      this.redis.zrangebyscore(
        RESERVATION_PERSIST_RETRY_SCHEDULE_KEY,
        "-inf",
        "+inf",
        "WITHSCORES",
        "LIMIT",
        0,
        safeLimit,
      ),
    ]);

    const items: RetryScheduleItem[] = [];

    for (let index = 0; index < rawEntries.length; index += 2) {
      const member = rawEntries[index];
      if (member === undefined) {
        continue;
      }

      const dueAtMs = Number(rawEntries[index + 1]);
      const overdue = dueAtMs <= now;

      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(member) as Record<string, unknown>;
      } catch {
        parsed = { raw: member };
      }

      items.push({
        dueAtMs,
        dueAt: new Date(dueAtMs).toISOString(),
        overdue,
        overdueByMs: overdue ? now - dueAtMs : null,
        reservationId:
          typeof parsed.reservationId === "string" ? parsed.reservationId : null,
        ticketLotId:
          typeof parsed.ticketLotId === "string" ? parsed.ticketLotId : null,
        userId: typeof parsed.userId === "string" ? parsed.userId : null,
        attempt: typeof parsed.attempt === "number" ? parsed.attempt : null,
        reason: typeof parsed.reason === "string" ? parsed.reason : null,
      });
    }

    const view: RetryScheduleView = {
      scheduleKey: RESERVATION_PERSIST_RETRY_SCHEDULE_KEY,
      total,
      overdueCount,
      dueWithin60sCount,
      items,
      sampledAt: new Date().toISOString(),
    };

    this.logger.debug(CONTEXT, "Retry schedule sampled", {
      total: view.total,
      overdueCount: view.overdueCount,
      dueWithin60sCount: view.dueWithin60sCount,
      itemsReturned: view.items.length,
    });

    return view;
  }
}
