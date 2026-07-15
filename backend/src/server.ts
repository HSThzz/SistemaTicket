/**
 * @file Ponto de entrada do servidor HTTP: banco, Redis, workers e graceful shutdown.
 * @module server
 */

import "reflect-metadata";
import { createApp } from "./app";
import { AppDataSource } from "./shared/infrastructure/config/data-source";
import { env, validateProductionConfig } from "./shared/infrastructure/config/env";
import { getPaymentGatewayProvider } from "./modules/payment/infrastructure/gateways/createPaymentGateway";
import { Logger } from "./shared/infrastructure/config/logger";
import { closeRedisConnections, getRedis, getRedisWorker } from "./shared/infrastructure/config/redis";
import { closeBullMQQueues } from "./shared/infrastructure/messaging/closeBullMQQueues";
import {
  setContactFormWorker,
  setPaymentProcessingWorker,
  setReservationExpiryWorker,
  setReservationPersistenceWorker,
  setStockReconciliationWorker,
  setTicketDeliveryWorker,
} from "./shared/runtime/workerRegistry";
import { ReservationExpiryWorker } from "./modules/sales/infrastructure/workers/ReservationExpiryWorker";
import { ReservationPersistenceWorker } from "./modules/sales/infrastructure/workers/ReservationPersistenceWorker";
import { StockReconciliationWorker } from "./modules/sales/infrastructure/workers/StockReconciliationWorker";
import { PaymentProcessingWorker } from "./modules/payment/infrastructure/workers/PaymentProcessingWorker";
import { TicketDeliveryWorker } from "./modules/notifications/infrastructure/workers/TicketDeliveryWorker";
import { OrderRefundNotificationWorker } from "./modules/notifications/infrastructure/workers/OrderRefundNotificationWorker";
import { ContactFormWorker } from "./modules/leads/infrastructure/workers/ContactFormWorker";
import { ParticipationNotificationWorker } from "./modules/participation/infrastructure/workers/ParticipationNotificationWorker";
import { configureEmailProviders } from "./modules/notifications/infrastructure/email/configureEmailProviders";

const logger = Logger.getInstance();
const CONTEXT = "Server";

let expiryWorker: ReservationExpiryWorker | null = null;
let persistenceWorker: ReservationPersistenceWorker | null = null;
let stockReconciliationWorker: StockReconciliationWorker | null = null;
let paymentProcessingWorker: PaymentProcessingWorker | null = null;
let ticketDeliveryWorker: TicketDeliveryWorker | null = null;
let orderRefundNotificationWorker: OrderRefundNotificationWorker | null = null;
let contactFormWorker: ContactFormWorker | null = null;
let participationNotificationWorker: ParticipationNotificationWorker | null = null;

/**
 * Inicializa dependências (PostgreSQL, Redis), workers de reserva e sobe o HTTP server.
 * Encerra o processo com código 1 em falha de conexão ou de workers.
 * @returns Promise resolvida quando o servidor estiver escutando na porta configurada.
 */
async function bootstrap(): Promise<void> {
  validateProductionConfig();
  configureEmailProviders();

  try {
    await AppDataSource.initialize();
    logger.info(CONTEXT, "Database connection established");
  } catch (error) {
    logger.error(CONTEXT, "Failed to connect to database", {
      error: error instanceof Error ? error.message : String(error),
    });
    
    process.exit(1);
  }

  const redis = getRedis();

  try {
    await redis.ping();
    logger.info(CONTEXT, "Redis connection established");
  } catch (error) {
    logger.error(CONTEXT, "Failed to connect to Redis", {
      error: error instanceof Error ? error.message : String(error),
    });

    process.exit(1);
  }

  expiryWorker = new ReservationExpiryWorker(redis);

  persistenceWorker = new ReservationPersistenceWorker(getRedisWorker());

  try {
    await expiryWorker.start();

    setReservationExpiryWorker(expiryWorker);
  } catch (error) {
    logger.error(CONTEXT, "Failed to start reservation expiry worker", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  try {
    await persistenceWorker.start();

    setReservationPersistenceWorker(persistenceWorker);

  } catch (error) {
    logger.error(CONTEXT, "Failed to start reservation persistence worker", {
      error: error instanceof Error ? error.message : String(error),
    });

    process.exit(1);
  }

  if (env.stockReconciliationIntervalMs > 0) {
    stockReconciliationWorker = new StockReconciliationWorker(
      redis,
      env.stockReconciliationIntervalMs,
    );

    try {
      await stockReconciliationWorker.start();

      setStockReconciliationWorker(stockReconciliationWorker);
    } catch (error) {
      logger.error(CONTEXT, "Failed to start stock reconciliation worker", {
        error: error instanceof Error ? error.message : String(error),
      });

      process.exit(1);
    }
  } else {
    logger.info(CONTEXT, "Stock reconciliation worker disabled (interval <= 0)");
  }

  paymentProcessingWorker = new PaymentProcessingWorker(getRedisWorker());

  try {
    await paymentProcessingWorker.start();
    setPaymentProcessingWorker(paymentProcessingWorker);
  } catch (error) {
    logger.error(CONTEXT, "Failed to start payment processing worker", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  ticketDeliveryWorker = new TicketDeliveryWorker();

  try {
    await ticketDeliveryWorker.start();
    setTicketDeliveryWorker(ticketDeliveryWorker);
  } catch (error) {
    logger.error(CONTEXT, "Failed to start ticket delivery worker", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  orderRefundNotificationWorker = new OrderRefundNotificationWorker();

  try {
    await orderRefundNotificationWorker.start();
  } catch (error) {
    logger.error(CONTEXT, "Failed to start order refund notification worker", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  contactFormWorker = new ContactFormWorker();

  try {
    await contactFormWorker.start();
    setContactFormWorker(contactFormWorker);
  } catch (error) {
    logger.error(CONTEXT, "Failed to start contact form worker", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  participationNotificationWorker = new ParticipationNotificationWorker();

  try {
    await participationNotificationWorker.start();
  } catch (error) {
    logger.error(CONTEXT, "Failed to start participation notification worker", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  const app = createApp();

  app.listen(env.port, () => {
    logger.info(CONTEXT, `Server listening on port ${env.port}`, {
      environment: env.nodeEnv,
      paymentGateway: getPaymentGatewayProvider(),
    });
  });
}

/**
 * Encerra workers, conexões TypeORM e Redis de forma ordenada.
 * @returns Promise resolvida após `process.exit(0)`.
 */
async function shutdown(): Promise<void> {
  logger.info(CONTEXT, "Shutting down gracefully");

  await expiryWorker?.stop();

  setReservationExpiryWorker(null);

  await persistenceWorker?.stop();

  setReservationPersistenceWorker(null);

  await stockReconciliationWorker?.stop();

  setStockReconciliationWorker(null);

  await paymentProcessingWorker?.stop();

  setPaymentProcessingWorker(null);

  await ticketDeliveryWorker?.stop();

  setTicketDeliveryWorker(null);

  await orderRefundNotificationWorker?.stop();

  orderRefundNotificationWorker = null;

  await contactFormWorker?.stop();

  setContactFormWorker(null);

  await participationNotificationWorker?.stop();

  participationNotificationWorker = null;

  await closeBullMQQueues();

  await AppDataSource.destroy();

  await closeRedisConnections();

  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

bootstrap().catch((error) => {
  logger.fatal(CONTEXT, "Unhandled bootstrap error", {
    error: error instanceof Error ? error.message : String(error),
  });

  process.exit(1);
});
