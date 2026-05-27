import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import { TICKET_LOT_STOCK_KEY_PREFIX } from "../../src/config/constants";
import { UserRole } from "../../src/entities/enums";
import { InsufficientStockError } from "../../src/errors/PurchaseError";
import { PurchaseService } from "../../src/services/PurchaseService";
import { createPublishedEventWithLot, createUser } from "../helpers/fixtures";
import {
  resetTestState,
  setupTestContext,
  teardownTestContext,
  type TestContext,
} from "../helpers/testContext";

describe("Stock concurrency", () => {
  let ctx: TestContext;
  let purchaseService: PurchaseService;

  before(async () => {
    ctx = await setupTestContext({ startWorker: false });
    purchaseService = new PurchaseService(ctx.dataSource, ctx.redis);
  });

  after(async () => {
    await teardownTestContext(ctx);
  });

  beforeEach(async () => {
    await resetTestState(ctx);
  });

  it("never oversells under concurrent reservations", async () => {
    const stock = 50;
    const attempts = 100;

    const user = await createUser(ctx.dataSource, {
      name: "Buyer",
      email: "buyer@test.com",
      password: "pass123",
      document: "55555555555",
    });

    const producer = await createUser(ctx.dataSource, {
      name: "Producer",
      email: "producer-stock@test.com",
      password: "pass123",
      document: "66666666666",
      role: UserRole.PRODUCER,
    });

    const { lot } = await createPublishedEventWithLot(
      ctx.dataSource,
      producer.id,
      stock,
    );

    await ctx.redis.set(`${TICKET_LOT_STOCK_KEY_PREFIX}${lot.id}`, String(stock));

    const results = await Promise.allSettled(
      Array.from({ length: attempts }, () =>
        purchaseService.reserveTickets(user.id, lot.id, 1),
      ),
    );

    const successes = results.filter((result) => result.status === "fulfilled");
    const failures = results.filter((result) => result.status === "rejected");

    assert.equal(successes.length, stock);
    assert.equal(failures.length, attempts - stock);

    for (const failure of failures) {
      assert.equal(failure.status, "rejected");
      if (failure.status === "rejected") {
        assert.ok(failure.reason instanceof InsufficientStockError);
      }
    }

    const redisStock = await ctx.redis.get(`${TICKET_LOT_STOCK_KEY_PREFIX}${lot.id}`);
    assert.equal(redisStock, "0");
  });

  it("accumulates successful reservations without negative redis stock", async () => {
    const stock = 20;

    const user = await createUser(ctx.dataSource, {
      name: "Buyer 2",
      email: "buyer2@test.com",
      password: "pass123",
      document: "77777777777",
    });

    const producer = await createUser(ctx.dataSource, {
      name: "Producer 2",
      email: "producer2-stock@test.com",
      password: "pass123",
      document: "88888888888",
      role: UserRole.PRODUCER,
    });

    const { lot } = await createPublishedEventWithLot(
      ctx.dataSource,
      producer.id,
      stock,
    );

    await ctx.redis.set(`${TICKET_LOT_STOCK_KEY_PREFIX}${lot.id}`, String(stock));

    let totalReserved = 0;

    for (let index = 0; index < stock; index += 1) {
      const result = await purchaseService.reserveTickets(user.id, lot.id, 1);
      totalReserved += result.quantity;
    }

    assert.equal(totalReserved, stock);

    await assert.rejects(
      () => purchaseService.reserveTickets(user.id, lot.id, 1),
      InsufficientStockError,
    );

    const redisStock = await ctx.redis.get(`${TICKET_LOT_STOCK_KEY_PREFIX}${lot.id}`);
    assert.equal(Number(redisStock), 0);
  });
});
