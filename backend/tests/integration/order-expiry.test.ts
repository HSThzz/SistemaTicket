import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import {
  RESERVATION_KEY_PREFIX,
  TICKET_LOT_STOCK_KEY_PREFIX,
} from "../../src/shared/infrastructure/config/constants";
import { Order } from "../../src/shared/infrastructure/persistence/entities/Order";
import { Reservation } from "../../src/shared/infrastructure/persistence/entities/Reservation";
import { TicketLot } from "../../src/shared/infrastructure/persistence/entities/TicketLot";
import {
  OrderStatus,
  ReservationStatus,
  UserRole,
} from "../../src/shared/kernel/enums";
import { expireUnpaidOrderByReservationId } from "../../src/modules/payment/application/services/expireUnpaidOrderByReservationId";
import { ReservationExpiryWorker } from "../../src/modules/sales/infrastructure/workers/ReservationExpiryWorker";
import {
  createPublishedEventWithLot,
  createUser,
  login,
  pollReservationPhase,
  TEST_USER_PASSWORD,
} from "../helpers/fixtures";
import {
  resetTestState,
  setupTestContext,
  teardownTestContext,
  type TestContext,
} from "../helpers/testContext";

describe("Order expiry integration", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setupTestContext();
  });

  after(async () => {
    await teardownTestContext(ctx);
  });

  beforeEach(async () => {
    await resetTestState(ctx);
  });

  it("marks pending order as FAILED and restores stock when PIX TTL expires", async () => {
    const initialStock = 5;
    const quantity = 2;

    const producer = await createUser(ctx.dataSource, {
      name: "Producer",
      email: "producer-expiry@test.com",
      password: TEST_USER_PASSWORD,
      document: "12121212121",
      role: UserRole.PRODUCER,
    });

    const client = await createUser(ctx.dataSource, {
      name: "Client",
      email: "client-expiry@test.com",
      password: TEST_USER_PASSWORD,
      document: "13131313131",
    });

    const clientToken = await login(ctx.agent, client.email, client.password);
    const { lot } = await createPublishedEventWithLot(
      ctx.dataSource,
      producer.id,
      initialStock,
    );

    const reserveResponse = await ctx.agent
      .post("/purchases/reserve")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ ticketLotId: lot.id, quantity })
      .expect(201);

    const reservationId = reserveResponse.body.reservation.id as string;

    const pendingPayment = await pollReservationPhase(
      ctx.agent,
      clientToken,
      reservationId,
      "PENDING_PAYMENT",
    );

    const orderId = (pendingPayment.order as { id: string }).id;

    const lotBeforeExpiry = await ctx.dataSource
      .getRepository(TicketLot)
      .findOneByOrFail({ id: lot.id });
    assert.equal(lotBeforeExpiry.availableQuantity, initialStock - quantity);

    const expired = await expireUnpaidOrderByReservationId(
      ctx.redis,
      reservationId,
    );
    assert.equal(expired, true);

    const order = await ctx.dataSource
      .getRepository(Order)
      .findOneByOrFail({ id: orderId });
    assert.equal(order.status, OrderStatus.FAILED);

    const reservation = await ctx.dataSource
      .getRepository(Reservation)
      .findOneByOrFail({ id: reservationId });
    assert.equal(reservation.status, ReservationStatus.EXPIRED);

    const lotAfterExpiry = await ctx.dataSource
      .getRepository(TicketLot)
      .findOneByOrFail({ id: lot.id });
    assert.equal(lotAfterExpiry.availableQuantity, initialStock);

    const redisStock = await ctx.redis.get(
      `${TICKET_LOT_STOCK_KEY_PREFIX}${lot.id}`,
    );
    assert.equal(Number(redisStock), initialStock);

    const statusAfterExpiry = await ctx.agent
      .get(`/purchases/reservations/${reservationId}`)
      .set("Authorization", `Bearer ${clientToken}`)
      .expect(200);

    assert.equal(statusAfterExpiry.body.phase, "FAILED");
  });

  it("expires via ReservationExpiryWorker when Redis reservation TTL fires", async () => {
    const expiryWorker = new ReservationExpiryWorker(ctx.redis);
    await expiryWorker.start();

    try {
      const initialStock = 5;
      const quantity = 1;

      const producer = await createUser(ctx.dataSource, {
        name: "Producer TTL",
        email: "producer-ttl-worker@test.com",
        password: TEST_USER_PASSWORD,
        document: "14141414141",
        role: UserRole.PRODUCER,
      });

      const client = await createUser(ctx.dataSource, {
        name: "Client TTL",
        email: "client-ttl-worker@test.com",
        password: TEST_USER_PASSWORD,
        document: "15151515151",
      });

      const clientToken = await login(ctx.agent, client.email, client.password);
      const { lot } = await createPublishedEventWithLot(
        ctx.dataSource,
        producer.id,
        initialStock,
      );

      const reserveResponse = await ctx.agent
        .post("/purchases/reserve")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ ticketLotId: lot.id, quantity })
        .expect(201);

      const reservationId = reserveResponse.body.reservation.id as string;

      await pollReservationPhase(
        ctx.agent,
        clientToken,
        reservationId,
        "PENDING_PAYMENT",
      );

      const reservationKey = `${RESERVATION_KEY_PREFIX}${reservationId}`;
      await ctx.redis.expire(reservationKey, 1);

      await new Promise((resolve) => setTimeout(resolve, 2500));

      const order = await ctx.dataSource.getRepository(Order).findOne({
        where: { reservationId },
      });
      assert.ok(order);
      assert.equal(order.status, OrderStatus.FAILED);

      const redisStock = await ctx.redis.get(
        `${TICKET_LOT_STOCK_KEY_PREFIX}${lot.id}`,
      );
      assert.equal(Number(redisStock), initialStock);
    } finally {
      await expiryWorker.stop();
    }
  });
});
