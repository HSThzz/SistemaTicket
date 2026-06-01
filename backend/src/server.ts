import "reflect-metadata";
import { createApp } from "./app";
import { AppDataSource } from "./shared/infrastructure/config/data-source";
import { env } from "./shared/infrastructure/config/env";
import { getPaymentGatewayProvider } from "./modules/payment/infrastructure/gateways/createPaymentGateway";
import { Logger } from "./shared/infrastructure/config/logger";
import { closeRedisConnections, getRedis, getRedisWorker } from "./shared/infrastructure/config/redis";
import { setReservationPersistenceWorker } from "./shared/runtime/workerRegistry";
import { PaymentService } from "./modules/payment/application/PaymentService";
import { ReservationExpiryWorker } from "./modules/sales/infrastructure/workers/ReservationExpiryWorker";
import { ReservationPersistenceWorker } from "./modules/sales/infrastructure/workers/ReservationPersistenceWorker";

const logger = Logger.getInstance();
const CONTEXT = "Server";

let expiryWorker: ReservationExpiryWorker | null = null;
let persistenceWorker: ReservationPersistenceWorker | null = null;

async function bootstrap(): Promise<void> {
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
  } catch (error) {
    logger.error(CONTEXT, "Failed to start reservation expiry worker", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  try {
    await persistenceWorker.start();
  } catch (error) {
    logger.error(CONTEXT, "Failed to start reservation persistence worker", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  setReservationPersistenceWorker(persistenceWorker);

  const app = createApp();

  app.listen(env.port, () => {
    logger.info(CONTEXT, `Server listening on port ${env.port}`, {
      environment: env.nodeEnv,
      paymentGateway: getPaymentGatewayProvider(),
    });
  });
}

async function shutdown(): Promise<void> {
  logger.info(CONTEXT, "Shutting down gracefully");

  await expiryWorker?.stop();
  await persistenceWorker?.stop();
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
