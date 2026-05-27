import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import { Logger } from "../config/logger";
import { getReservationPersistenceWorker } from "../runtime/workerRegistry";
import { QueueMonitorService } from "./QueueMonitorService";

const CONTEXT = "HealthService";

export type HealthStatus = "ok" | "degraded" | "down";

export interface ComponentHealth {
  status: HealthStatus;
  latencyMs?: number;
  error?: string;
}

export interface HealthReport {
  status: HealthStatus;
  timestamp: string;
  components: {
    postgres: ComponentHealth;
    redis: ComponentHealth;
    worker: ComponentHealth & {
      running: boolean;
      metrics?: {
        processedCount: number;
        failedCount: number;
        retryScheduledCount: number;
        dlqCount: number;
      };
    };
    queues: ComponentHealth & {
      persistQueueLength: number;
      retryQueueLength: number;
      dlqLength: number;
      retryScheduled: number;
      alerts: string[];
    };
  };
}

export class HealthService {
  private readonly logger = Logger.getInstance();
  private readonly queueMonitor: QueueMonitorService;

  constructor(
    private readonly dataSource: DataSource,
    private readonly redis: Redis,
  ) {
    this.queueMonitor = new QueueMonitorService(redis);
  }

  async check(): Promise<HealthReport> {
    const [postgres, redis, queues, worker] = await Promise.all([
      this.checkPostgres(),
      this.checkRedis(),
      this.checkQueues(),
      this.checkWorker(),
    ]);

    const components = { postgres, redis, worker, queues };
    const status = this.resolveOverallStatus(components);

    const report: HealthReport = {
      status,
      timestamp: new Date().toISOString(),
      components,
    };

    this.logger.debug(CONTEXT, "Health check completed", {
      status: report.status,
      postgres: postgres.status,
      redis: redis.status,
      worker: worker.status,
      queues: queues.status,
    });

    return report;
  }

  private async checkPostgres(): Promise<ComponentHealth> {
    const startedAt = Date.now();

    try {
      if (!this.dataSource.isInitialized) {
        return { status: "down", error: "Database not initialized" };
      }

      await this.dataSource.query("SELECT 1");

      return {
        status: "ok",
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        status: "down",
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async checkRedis(): Promise<ComponentHealth> {
    const startedAt = Date.now();

    try {
      const pong = await this.redis.ping();
      if (pong !== "PONG") {
        return {
          status: "down",
          latencyMs: Date.now() - startedAt,
          error: `Unexpected ping response: ${pong}`,
        };
      }

      return {
        status: "ok",
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        status: "down",
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async checkQueues(): Promise<HealthReport["components"]["queues"]> {
    try {
      const stats = await this.queueMonitor.getStats();
      const alerts: string[] = [];

      if (stats.dlqLength > 0) {
        alerts.push(`DLQ has ${stats.dlqLength} job(s)`);
      }

      if (stats.retryScheduled > 0) {
        const schedule = await this.queueMonitor.getRetrySchedule(1);
        if (schedule.overdueCount > 0) {
          alerts.push(`${schedule.overdueCount} retry job(s) overdue`);
        }
      }

      if (stats.persistQueueLength > 1000) {
        alerts.push(`Persist queue backlog: ${stats.persistQueueLength}`);
      }

      return {
        status: alerts.length > 0 ? "degraded" : "ok",
        persistQueueLength: stats.persistQueueLength,
        retryQueueLength: stats.retryQueueLength,
        dlqLength: stats.dlqLength,
        retryScheduled: stats.retryScheduled,
        alerts,
      };
    } catch (error) {
      return {
        status: "degraded",
        persistQueueLength: 0,
        retryQueueLength: 0,
        dlqLength: 0,
        retryScheduled: 0,
        alerts: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private checkWorker(): HealthReport["components"]["worker"] {
    const worker = getReservationPersistenceWorker();

    if (!worker) {
      return {
        status: "degraded",
        running: false,
        error: "ReservationPersistenceWorker is not registered",
      };
    }

    const metrics = worker.getMetrics();

    return {
      status: "ok",
      running: true,
      metrics,
    };
  }

  private resolveOverallStatus(
    components: HealthReport["components"],
  ): HealthStatus {
    if (
      components.postgres.status === "down" ||
      components.redis.status === "down"
    ) {
      return "down";
    }

    if (
      components.worker.status === "degraded" ||
      components.queues.status === "degraded"
    ) {
      return "degraded";
    }

    return "ok";
  }
}
