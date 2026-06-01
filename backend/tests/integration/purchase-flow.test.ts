import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import { Ticket } from "../../src/shared/infrastructure/persistence/entities/Ticket";
import { OrderStatus, UserRole } from "../../src/shared/kernel/enums";
import {
  createPublishedEventWithLot,
  createUser,
  login,
  pollReservationPhase,
} from "../helpers/fixtures";
import {
  resetTestState,
  setupTestContext,
  teardownTestContext,
  type TestContext,
} from "../helpers/testContext";

describe("Purchase flow integration", () => {
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

  it("completes reserve → persist → PIX → webhook → ticket issuance", async () => {
    const producer = await createUser(ctx.dataSource, {
      name: "Producer",
      email: "producer@test.com",
      password: "pass123",
      document: "11111111111",
      role: UserRole.PRODUCER,
    });

    const client = await createUser(ctx.dataSource, {
      name: "Client",
      email: "client@test.com",
      password: "pass123",
      document: "22222222222",
    });

    const clientToken = await login(ctx.agent, client.email, client.password);

    const { lot } = await createPublishedEventWithLot(
      ctx.dataSource,
      producer.id,
      10,
    );

    const reserveResponse = await ctx.agent
      .post("/purchases/reserve")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ ticketLotId: lot.id, quantity: 2 })
      .expect(201);

    const reservationId = reserveResponse.body.reservation.id as string;
    assert.ok(reservationId);

    const awaitingPayment = await pollReservationPhase(
      ctx.agent,
      clientToken,
      reservationId,
      "AWAITING_PAYMENT",
    );

    const order = awaitingPayment.order as { id: string; status: string };
    assert.equal(order.status, "PENDING");

    const payment = awaitingPayment.payment as { transactionId: string };
    assert.ok(payment.transactionId);

    await ctx.agent
      .post("/payments/dev/simulate")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ orderId: order.id })
      .expect(200);

    const paidStatus = await pollReservationPhase(
      ctx.agent,
      clientToken,
      reservationId,
      "PAID",
    );

    assert.equal(paidStatus.phase, "PAID");

    const ticketsResponse = await ctx.agent
      .get("/tickets/me")
      .set("Authorization", `Bearer ${clientToken}`)
      .expect(200);

    assert.equal(ticketsResponse.body.tickets.length, 2);

    const ordersResponse = await ctx.agent
      .get("/orders/me")
      .set("Authorization", `Bearer ${clientToken}`)
      .expect(200);

    assert.equal(ordersResponse.body.orders.length, 1);
    assert.equal(ordersResponse.body.orders[0].status, OrderStatus.PAID);

    const ticketCount = await ctx.dataSource.getRepository(Ticket).count();
    assert.equal(ticketCount, 2);
  });

  it("rejects webhook without secret in test environment when secret is configured", async () => {
    const producer = await createUser(ctx.dataSource, {
      name: "Producer",
      email: "producer2@test.com",
      password: "pass123",
      document: "33333333333",
      role: UserRole.PRODUCER,
    });

    const client = await createUser(ctx.dataSource, {
      name: "Client",
      email: "client2@test.com",
      password: "pass123",
      document: "44444444444",
    });

    const clientToken = await login(ctx.agent, client.email, client.password);
    const { lot } = await createPublishedEventWithLot(ctx.dataSource, producer.id, 5);

    const reserveResponse = await ctx.agent
      .post("/purchases/reserve")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ ticketLotId: lot.id, quantity: 1 })
      .expect(201);

    const reservationId = reserveResponse.body.reservation.id as string;
    const status = await pollReservationPhase(
      ctx.agent,
      clientToken,
      reservationId,
      "AWAITING_PAYMENT",
    );

    const orderId = (status.order as { id: string }).id;

    await ctx.agent
      .post("/payments/webhook")
      .send({
        event: "payment.succeeded",
        data: {
          orderId,
          transactionId: "pix_unauthorized",
        },
      })
      .expect(401);
  });
});
