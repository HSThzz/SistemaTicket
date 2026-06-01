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
import {
  setReservationExpiryWorker,
  setReservationPersistenceWorker,
} from "./shared/runtime/workerRegistry";
import { PaymentService } from "./modules/payment/application/PaymentService";
import { ReservationExpiryWorker } from "./modules/sales/infrastructure/workers/ReservationExpiryWorker";
import { ReservationPersistenceWorker } from "./modules/sales/infrastructure/workers/ReservationPersistenceWorker";

const logger = Logger.getInstance();
const CONTEXT = "Server";

let expiryWorker: ReservationExpiryWorker | null = null;
let persistenceWorker: ReservationPersistenceWorker | null = null;

/**
 * Inicializa dependências (PostgreSQL, Redis), workers de reserva e sobe o HTTP server.
 * Encerra o processo com código 1 em falha de conexão ou de workers.
 * @returns Promise resolvida quando o servidor estiver escutando na porta configurada.
 */
async function bootstrap(): Promise<void> {
  validateProductionConfig();

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

  expiryWorker = new ReservationExpiryWorker(AppDataSource, redis);
  persistenceWorker = new ReservationPersistenceWorker(
    AppDataSource,
    getRedisWorker(),
    new PaymentService(AppDataSource, redis),
  );

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
