import "./env";
import "reflect-metadata";
import type { Application } from "express";
import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import request from "supertest";
import { createApp } from "../../src/app";
import { AppDataSource } from "../../src/config/data-source";
import { getRedis, getRedisWorker, closeRedisConnections } from "../../src/config/redis";
import { setReservationPersistenceWorker } from "../../src/runtime/workerRegistry";
import { PaymentService } from "../../src/services/PaymentService";
import { ReservationPersistenceWorker } from "../../src/workers/ReservationPersistenceWorker";

export interface TestContext {
  app: Application;
  agent: ReturnType<typeof request>;
  dataSource: DataSource;
  redis: Redis;
  persistenceWorker: ReservationPersistenceWorker | null;
}

export interface SetupTestContextOptions {
  startWorker?: boolean;
}

export async function setupTestContext(
  options: SetupTestContextOptions = {},
): Promise<TestContext> {
  const startWorker = options.startWorker ?? true;

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
  }

  const redis = getRedis();
  await redis.ping();

  let persistenceWorker: ReservationPersistenceWorker | null = null;

  if (startWorker) {
    persistenceWorker = new ReservationPersistenceWorker(
      AppDataSource,
      getRedisWorker(),
      new PaymentService(AppDataSource, redis),
    );
    await persistenceWorker.start();
    setReservationPersistenceWorker(persistenceWorker);
  }

  const app = createApp();

  return {
    app,
    agent: request(app),
    dataSource: AppDataSource,
    redis,
    persistenceWorker,
  };
}

export async function teardownTestContext(ctx: TestContext): Promise<void> {
  await ctx.persistenceWorker?.stop();
  setReservationPersistenceWorker(null);

  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }

  await closeRedisConnections();
}

export async function resetDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.query(`
    TRUNCATE tickets, orders, reservations, ticket_lots, events, users
    RESTART IDENTITY CASCADE
  `);
}

export async function resetRedis(redis: Redis): Promise<void> {
  await redis.flushdb();
}

export async function resetTestState(ctx: TestContext): Promise<void> {
  await resetRedis(ctx.redis);
  await resetDatabase(ctx.dataSource);
}
