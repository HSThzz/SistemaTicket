import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import { TICKET_LOT_STOCK_KEY_PREFIX } from "../../src/shared/infrastructure/config/constants";
import { Ticket } from "../../src/shared/infrastructure/persistence/entities/Ticket";
import { TicketLot } from "../../src/shared/infrastructure/persistence/entities/TicketLot";
import { OrderStatus, TicketStatus, UserRole } from "../../src/shared/kernel/enums";
import { TEST_WEBHOOK_SECRET } from "../helpers/env";
import { signInternalWebhookPayload } from "../../src/modules/payment/infrastructure/gateways/WebhookAuthService";
import {
  createPublishedEventWithLot,
  createUser,
  login,
  pollReservationPhase,
  pollUntilAwaitingPayment,
} from "../helpers/fixtures";
import {
  resetTestState,
  setupTestContext,
  teardownTestContext,
  type TestContext,
} from "../helpers/testContext";

describe("Order refund integration", () => {
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

  it("refunds paid order, cancels tickets and restores stock", async () => {
    const initialStock = 10;
    const quantity = 2;

    const admin = await createUser(ctx.dataSource, {
      name: "Admin",
      email: "admin-refund@test.com",
      password: "pass123",
      document: "14141414141",
      role: UserRole.ADMIN,
    });

    const producer = await createUser(ctx.dataSource, {
      name: "Producer",
      email: "producer-refund@test.com",
      password: "pass123",
      document: "15151515151",
      role: UserRole.PRODUCER,
    });

    const client = await createUser(ctx.dataSource, {
      name: "Client",
      email: "client-refund@test.com",
      password: "pass123",
      document: "16161616161",
    });

    const adminToken = await login(ctx.agent, admin.email, admin.password);
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

    const awaitingPayment = await pollUntilAwaitingPayment(
      ctx.agent,
      clientToken,
      reservationId,
    );

    const order = awaitingPayment.order as { id: string; status: string };
    const payment = awaitingPayment.payment as { transactionId: string };

    const webhookBody = {
      event: "payment.succeeded" as const,
      data: {
        orderId: order.id,
        transactionId: payment.transactionId,
        paidAt: new Date().toISOString(),
      },
    };

    const signed = signInternalWebhookPayload({
      secret: TEST_WEBHOOK_SECRET,
      body: webhookBody,
    });

    await ctx.agent
      .post("/payments/webhook")
      .set("Content-Type", "application/json")
      .set("x-webhook-timestamp", signed.timestamp)
      .set("x-webhook-signature", signed.signature)
      .send(JSON.parse(signed.body))
      .expect(202);

    await pollReservationPhase(ctx.agent, clientToken, reservationId, "PAID");

    const lotBeforeRefund = await ctx.dataSource
      .getRepository(TicketLot)
      .findOneByOrFail({ id: lot.id });
    assert.equal(lotBeforeRefund.availableQuantity, initialStock - quantity);

    const refundResponse = await ctx.agent
      .post(`/orders/${order.id}/refund`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    assert.equal(refundResponse.body.refund.orderId, order.id);
    assert.equal(refundResponse.body.refund.ticketsCancelled, quantity);
    assert.equal(refundResponse.body.refund.stockRestored, quantity);

    const refundedOrder = await ctx.agent
      .get("/orders/me")
      .set("Authorization", `Bearer ${clientToken}`)
      .expect(200);

    assert.equal(refundedOrder.body.orders[0].status, OrderStatus.REFUNDED);

    const tickets = await ctx.dataSource.getRepository(Ticket).find({
      where: { orderId: order.id },
    });
    assert.equal(tickets.length, quantity);
    assert.ok(tickets.every((ticket) => ticket.status === TicketStatus.CANCELLED));

    const lotAfterRefund = await ctx.dataSource
      .getRepository(TicketLot)
      .findOneByOrFail({ id: lot.id });
    assert.equal(lotAfterRefund.availableQuantity, initialStock);

    const redisStock = await ctx.redis.get(
      `${TICKET_LOT_STOCK_KEY_PREFIX}${lot.id}`,
    );
    assert.equal(Number(redisStock), initialStock);
  });

  it("rejects refund for non-admin users", async () => {
    const producer = await createUser(ctx.dataSource, {
      name: "Producer",
      email: "producer-refund-deny@test.com",
      password: "pass123",
      document: "17171717171",
      role: UserRole.PRODUCER,
    });

    const client = await createUser(ctx.dataSource, {
      name: "Client",
      email: "client-refund-deny@test.com",
      password: "pass123",
      document: "18181818181",
    });

    const clientToken = await login(ctx.agent, client.email, client.password);
    const { lot } = await createPublishedEventWithLot(ctx.dataSource, producer.id, 5);

    const reserveResponse = await ctx.agent
      .post("/purchases/reserve")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ ticketLotId: lot.id, quantity: 1 })
      .expect(201);

    const reservationId = reserveResponse.body.reservation.id as string;
    const awaitingPayment = await pollUntilAwaitingPayment(
      ctx.agent,
      clientToken,
      reservationId,
    );

    const orderId = (awaitingPayment.order as { id: string }).id;

    await ctx.agent
      .post(`/orders/${orderId}/refund`)
      .set("Authorization", `Bearer ${clientToken}`)
      .expect(403);
  });
});
