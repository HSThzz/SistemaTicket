import "./env";
import "reflect-metadata";
import type { Application } from "express";
import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import request from "supertest";
import { createApp } from "../../src/app";
import { AppDataSource } from "../../src/shared/infrastructure/config/data-source";
import { getRedis, getRedisWorker, closeRedisConnections } from "../../src/shared/infrastructure/config/redis";
import {
  setReservationExpiryWorker,
  setReservationPersistenceWorker,
} from "../../src/shared/runtime/workerRegistry";
import { PaymentService } from "../../src/modules/payment/application/PaymentService";
import { ReservationExpiryWorker } from "../../src/modules/sales/infrastructure/workers/ReservationExpiryWorker";
import { ReservationPersistenceWorker } from "../../src/modules/sales/infrastructure/workers/ReservationPersistenceWorker";

export interface TestContext {
  app: Application;
  agent: ReturnType<typeof request>;
  dataSource: DataSource;
  redis: Redis;
  persistenceWorker: ReservationPersistenceWorker | null;
  expiryWorker: ReservationExpiryWorker | null;
}

export interface SetupTestContextOptions {
  startWorker?: boolean;
  startExpiryWorker?: boolean;
}

export async function setupTestContext(
  options: SetupTestContextOptions = {},
): Promise<TestContext> {
  const startWorker = options.startWorker ?? true;
  const startExpiryWorker = options.startExpiryWorker ?? false;

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
  }

  const redis = getRedis();
  await redis.ping();

  let persistenceWorker: ReservationPersistenceWorker | null = null;
  let expiryWorker: ReservationExpiryWorker | null = null;
  const paymentService = new PaymentService(AppDataSource, redis);

  if (startWorker) {
    persistenceWorker = new ReservationPersistenceWorker(
      AppDataSource,
      getRedisWorker(),
      paymentService,
    );
    await persistenceWorker.start();
    setReservationPersistenceWorker(persistenceWorker);
  }

  if (startExpiryWorker) {
    expiryWorker = new ReservationExpiryWorker(
      AppDataSource,
      redis,
      paymentService,
    );
    await expiryWorker.start();
    setReservationExpiryWorker(expiryWorker);
  }

  const app = createApp();

  return {
    app,
    agent: request(app),
    dataSource: AppDataSource,
    redis,
    persistenceWorker,
    expiryWorker,
  };
}

export async function teardownTestContext(ctx: TestContext): Promise<void> {
  await ctx.expiryWorker?.stop();
  setReservationExpiryWorker(null);
  await ctx.persistenceWorker?.stop();
  setReservationPersistenceWorker(null);

  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }

  await closeRedisConnections();
}

function isDeadlockError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "40P01"
  );
}

export async function resetDatabase(dataSource: DataSource): Promise<void> {
  const truncateSql = `
    TRUNCATE tickets, orders, reservations, ticket_lots, events, users
    RESTART IDENTITY CASCADE
  `;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await dataSource.query(truncateSql);
      return;
    } catch (error) {
      if (!isDeadlockError(error) || attempt === 3) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 50 * attempt));
    }
  }
}

export async function resetRedis(redis: Redis): Promise<void> {
  await redis.flushdb();
}

export async function resetTestState(ctx: TestContext): Promise<void> {
  await resetRedis(ctx.redis);
  await resetDatabase(ctx.dataSource);
}
