import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import {
  RESERVATION_PERSIST_QUEUE_KEY,
  TICKET_LOT_STOCK_KEY_PREFIX,
} from "../../src/shared/infrastructure/config/constants";
import { UserRole } from "../../src/shared/kernel/enums";
import { StockReconciliationService } from "../../src/modules/sales/application/StockReconciliationService";
import { createPublishedEventWithLot, createUser } from "../helpers/fixtures";
import {
  resetTestState,
  setupTestContext,
  teardownTestContext,
  type TestContext,
} from "../helpers/testContext";

describe("Stock reconciliation", () => {
  let ctx: TestContext;
  let service: StockReconciliationService;

  before(async () => {
    ctx = await setupTestContext({ startWorker: false });
    service = new StockReconciliationService(ctx.dataSource, ctx.redis);
  });

  after(async () => {
    await teardownTestContext(ctx);
  });

  beforeEach(async () => {
    await resetTestState(ctx);
  });

  it("corrects Redis when it drifts above PostgreSQL", async () => {
    const producer = await createUser(ctx.dataSource, {
      name: "Producer",
      email: "producer-reconcile@test.com",
      password: "pass123",
      document: "11111111111",
      role: UserRole.PRODUCER,
    });

    const { lot } = await createPublishedEventWithLot(ctx.dataSource, producer.id, 20);

    await ctx.redis.set(`${TICKET_LOT_STOCK_KEY_PREFIX}${lot.id}`, "999");

    const report = await service.reconcileAll();

    assert.equal(report.correctedCount, 1);
    assert.equal(report.lots[0]?.expectedRedis, lot.availableQuantity);

    const redisStock = await ctx.redis.get(`${TICKET_LOT_STOCK_KEY_PREFIX}${lot.id}`);
    assert.equal(redisStock, String(lot.availableQuantity));
  });

  it("accounts for pending persist queue when computing expected Redis stock", async () => {
    const producer = await createUser(ctx.dataSource, {
      name: "Producer 2",
      email: "producer-reconcile2@test.com",
      password: "pass123",
      document: "22222222222",
      role: UserRole.PRODUCER,
    });

    const { lot } = await createPublishedEventWithLot(ctx.dataSource, producer.id, 10);

    const pendingQty = 3;
    const expectedRedis = lot.availableQuantity - pendingQty;

    await ctx.redis.set(`${TICKET_LOT_STOCK_KEY_PREFIX}${lot.id}`, String(expectedRedis));
    await ctx.redis.lpush(
      RESERVATION_PERSIST_QUEUE_KEY,
      JSON.stringify({
        reservationId: "00000000-0000-4000-8000-000000000001",
        userId: "00000000-0000-4000-8000-000000000002",
        ticketLotId: lot.id,
        quantity: pendingQty,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    );

    const report = await service.reconcileAll();

    assert.equal(report.correctedCount, 0);
    assert.equal(report.lots[0]?.expectedRedis, expectedRedis);
    assert.equal(report.lots[0]?.pendingInQueues, pendingQty);
  });

  it("initializes missing Redis key from PostgreSQL", async () => {
    const producer = await createUser(ctx.dataSource, {
      name: "Producer 3",
      email: "producer-reconcile3@test.com",
      password: "pass123",
      document: "33333333333",
      role: UserRole.PRODUCER,
    });

    const { lot } = await createPublishedEventWithLot(ctx.dataSource, producer.id, 15);

    const report = await service.reconcileAll();

    assert.equal(report.correctedCount, 1);

    const redisStock = await ctx.redis.get(`${TICKET_LOT_STOCK_KEY_PREFIX}${lot.id}`);
    assert.equal(redisStock, String(lot.availableQuantity));
  });
});
