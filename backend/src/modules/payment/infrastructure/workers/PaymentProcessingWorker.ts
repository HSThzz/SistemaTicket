/**
 * @file Worker que consome a fila Redis de webhooks de pagamento e emite ingressos.
 * @module payment/infrastructure/workers/PaymentProcessingWorker
 */

import type Redis from "ioredis";
import {
  PAYMENT_PROCESS_DLQ_KEY,
  PAYMENT_PROCESS_QUEUE_KEY,
  PAYMENT_PROCESS_RETRY_QUEUE_KEY,
  PAYMENT_PROCESS_RETRY_SCHEDULE_KEY,
} from "../../../../shared/infrastructure/config/constants";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import {
  buildPaymentJobReplayKey,
  clearPaymentJobQueueDedupe,
  type PaymentProcessJob,
} from "../../application/commands/enqueuePaymentJob";
import { handleMercadoPagoNotification } from "../../application/services/handleMercadoPagoNotification";
import { handleWebhook } from "../../application/services/handleWebhook";
import { PaymentAlreadyProcessedError, PaymentAmountMismatchError } from "../../domain/errors/PaymentError";
import { createPaymentGateway } from "../gateways/createPaymentGateway";
import { WebhookAuthService } from "../gateways/WebhookAuthService";

const CONTEXT = "PaymentProcessingWorker";
const MAX_ATTEMPTS = 5;
const RETRY_BASE_DELAY_MS = 500;
const RETRY_MAX_DELAY_MS = 20_000;

const DRAIN_RETRY_SCHEDULE_LUA = `
  local scheduleKey = KEYS[1]
  local retryQueueKey = KEYS[2]
  local now = tonumber(ARGV[1])
  local batchSize = tonumber(ARGV[2])

  local due = redis.call("ZRANGEBYSCORE", scheduleKey, 0, now, "LIMIT", 0, batchSize)
  for _, item in ipairs(due) do
    redis.call("ZREM", scheduleKey, item)
    redis.call("LPUSH", retryQueueKey, item)
  end
  return #due
`;

/**
 * Processa jobs de pagamento enfileirados pelos endpoints HTTP de webhook.
 */
export class PaymentProcessingWorker {
  private readonly logger = Logger.getInstance();
  private readonly webhookAuth: WebhookAuthService;
  private running = false;
  private processedCount = 0;
  private failedCount = 0;
  private retryScheduledCount = 0;
  private dlqCount = 0;

  constructor(private readonly redis: Redis) {
    this.webhookAuth = new WebhookAuthService(redis);
  }

  async start(): Promise<void> {
    this.running = true;
    this.logger.info(CONTEXT, "Worker started", {
      queueKey: PAYMENT_PROCESS_QUEUE_KEY,
    });
    void this.loop();
  }

  async stop(): Promise<void> {
    this.running = false;
    this.logger.info(CONTEXT, "Worker stopping", {
      processedCount: this.processedCount,
      failedCount: this.failedCount,
      retryScheduledCount: this.retryScheduledCount,
      dlqCount: this.dlqCount,
    });
  }

  getMetrics(): {
    processedCount: number;
    failedCount: number;
    retryScheduledCount: number;
    dlqCount: number;
  } {
    return {
      processedCount: this.processedCount,
      failedCount: this.failedCount,
      retryScheduledCount: this.retryScheduledCount,
      dlqCount: this.dlqCount,
    };
  }

  private async loop(): Promise<void> {
    const gateway = createPaymentGateway();

    while (this.running) {
      try {
        await this.drainRetrySchedule();

        const result = await this.redis.brpop(
          [PAYMENT_PROCESS_QUEUE_KEY, PAYMENT_PROCESS_RETRY_QUEUE_KEY],
          2,
        );

        if (!result) {
          continue;
        }

        const [, raw] = result;
        let job: PaymentProcessJob;

        try {
          job = JSON.parse(raw) as PaymentProcessJob;
        } catch {
          this.failedCount += 1;
          await this.redis.lpush(
            PAYMENT_PROCESS_DLQ_KEY,
            JSON.stringify({ raw, reason: "invalid_json" }),
          );
          this.dlqCount += 1;
          continue;
        }

        job.attempt = job.attempt ?? 1;

        const replayKey = buildPaymentJobReplayKey(job);

        if (await this.webhookAuth.isProcessed(replayKey)) {
          this.logger.info(CONTEXT, "Skipping already processed payment job", {
            replayKey,
            attempt: job.attempt,
          });
          this.processedCount += 1;
          continue;
        }

        try {
          await this.process(job, gateway);
          await this.webhookAuth.markProcessed(replayKey);
          this.processedCount += 1;
        } catch (error) {
          if (error instanceof PaymentAlreadyProcessedError) {
            await this.webhookAuth.markProcessed(replayKey);
            this.processedCount += 1;
            continue;
          }

          this.failedCount += 1;
          this.logger.error(CONTEXT, "Payment job failed", {
            attempt: job.attempt,
            error: error instanceof Error ? error.message : String(error),
          });

          const terminal =
            error instanceof PaymentAmountMismatchError ||
            (error instanceof Error && error.name === "PaymentAmountMismatchError");

          if (terminal) {
            await this.redis.lpush(
              PAYMENT_PROCESS_DLQ_KEY,
              JSON.stringify({
                ...job,
                attempt: job.attempt,
                reason: error instanceof Error ? error.message : String(error),
              }),
            );
            this.dlqCount += 1;
            await clearPaymentJobQueueDedupe(this.redis, job);
            continue;
          }

          await this.scheduleRetryOrDlq(
            job,
            error instanceof Error ? error.message : String(error),
          );
        }
      } catch (error) {
        this.failedCount += 1;
        this.logger.error(CONTEXT, "Worker loop error", {
          error: error instanceof Error ? error.message : String(error),
          failedCount: this.failedCount,
        });
      }
    }
  }

  private async process(
    job: PaymentProcessJob,
    gateway: ReturnType<typeof createPaymentGateway>,
  ): Promise<void> {
    if (job.kind === "webhook") {
      this.logger.info(CONTEXT, "Processing queued webhook", {
        event: job.payload.event,
        orderId: job.payload.data.orderId,
      });
      await handleWebhook(this.redis, job.payload, gateway);
      return;
    }

    this.logger.info(CONTEXT, "Processing queued Mercado Pago notification", {
      paymentId: job.paymentId,
    });
    await handleMercadoPagoNotification(this.redis, job.paymentId, gateway);
  }

  private computeRetryDelayMs(attempt: number): number {
    const exp = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
    const jitter = Math.floor(Math.random() * 250);
    return Math.min(exp + jitter, RETRY_MAX_DELAY_MS);
  }

  private async scheduleRetryOrDlq(
    job: PaymentProcessJob,
    reason: string,
  ): Promise<void> {
    const attempt = job.attempt ?? 1;

    if (attempt >= MAX_ATTEMPTS) {
      await this.redis.lpush(
        PAYMENT_PROCESS_DLQ_KEY,
        JSON.stringify({ ...job, attempt, reason }),
      );
      this.dlqCount += 1;
      await clearPaymentJobQueueDedupe(this.redis, job);
      this.logger.error(CONTEXT, "Payment job moved to DLQ", {
        reason,
        attempt,
        dlqKey: PAYMENT_PROCESS_DLQ_KEY,
      });
      return;
    }

    const nextAttempt = attempt + 1;
    const delayMs = this.computeRetryDelayMs(attempt);
    const dueAtMs = Date.now() + delayMs;

    await this.redis.zadd(
      PAYMENT_PROCESS_RETRY_SCHEDULE_KEY,
      dueAtMs,
      JSON.stringify({ ...job, attempt: nextAttempt, reason, dueAtMs }),
    );
    this.retryScheduledCount += 1;

    this.logger.warn(CONTEXT, "Payment job scheduled for retry", {
      attempt: nextAttempt,
      dueAtMs,
      delayMs,
    });
  }

  private async drainRetrySchedule(batchSize = 50): Promise<void> {
    await this.redis.eval(
      DRAIN_RETRY_SCHEDULE_LUA,
      2,
      PAYMENT_PROCESS_RETRY_SCHEDULE_KEY,
      PAYMENT_PROCESS_RETRY_QUEUE_KEY,
      String(Date.now()),
      String(batchSize),
    );
  }
}
