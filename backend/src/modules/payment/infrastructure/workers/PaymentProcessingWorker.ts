/**
 * @file Worker que consome a fila Redis de webhooks de pagamento e emite ingressos.
 * @module payment/infrastructure/workers/PaymentProcessingWorker
 */

import type Redis from "ioredis";
import { PAYMENT_PROCESS_QUEUE_KEY } from "../../../../shared/infrastructure/config/constants";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import type { PaymentProcessJob } from "../../application/commands/enqueuePaymentJob";
import { handleMercadoPagoNotification } from "../../application/services/handleMercadoPagoNotification";
import { handleWebhook } from "../../application/services/handleWebhook";
import { createPaymentGateway } from "../gateways/createPaymentGateway";

const CONTEXT = "PaymentProcessingWorker";

/**
 * Processa jobs de pagamento enfileirados pelos endpoints HTTP de webhook.
 */
export class PaymentProcessingWorker {
  private readonly logger = Logger.getInstance();
  private running = false;
  private processedCount = 0;
  private failedCount = 0;

  /**
   * @param redis - Cliente Redis da fila de processamento.
   */
  constructor(private readonly redis: Redis) {}

  /**
   * Inicia o loop de consumo da fila em background.
   */
  async start(): Promise<void> {
    this.running = true;
    this.logger.info(CONTEXT, "Worker started", {
      queueKey: PAYMENT_PROCESS_QUEUE_KEY,
    });
    void this.loop();
  }

  /**
   * Sinaliza parada do loop.
   */
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
    const gateway = createPaymentGateway();

    while (this.running) {
      try {
        const result = await this.redis.brpop(PAYMENT_PROCESS_QUEUE_KEY, 2);

        if (!result) {
          continue;
        }

        const [, raw] = result;
        const job = JSON.parse(raw) as PaymentProcessJob;

        await this.process(job, gateway);
        this.processedCount += 1;
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
}
