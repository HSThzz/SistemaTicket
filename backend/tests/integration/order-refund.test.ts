import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import { TICKET_LOT_STOCK_KEY_PREFIX } from "../../src/shared/infrastructure/config/constants";
import { Order } from "../../src/shared/infrastructure/persistence/entities/Order";
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
  TEST_USER_PASSWORD,
} from "../helpers/fixtures";
import {
  resetTestState,
  setupTestContext,
  teardownTestContext,
  type TestContext,
} from "../helpers/testContext";

async function payOrderViaWebhook(
  ctx: TestContext,
  clientToken: string,
  reservationId: string,
) {
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

  return {
    orderId: order.id,
    transactionId: payment.transactionId,
  };
}

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
      password: TEST_USER_PASSWORD,
      document: "14141414141",
      role: UserRole.ADMIN,
    });

    const producer = await createUser(ctx.dataSource, {
      name: "Producer",
      email: "producer-refund@test.com",
      password: TEST_USER_PASSWORD,
      document: "15151515151",
      role: UserRole.PRODUCER,
    });

    const client = await createUser(ctx.dataSource, {
      name: "Client",
      email: "client-refund@test.com",
      password: TEST_USER_PASSWORD,
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
    const { orderId } = await payOrderViaWebhook(ctx, clientToken, reservationId);

    const lotBeforeRefund = await ctx.dataSource
      .getRepository(TicketLot)
      .findOneByOrFail({ id: lot.id });
    assert.equal(lotBeforeRefund.availableQuantity, initialStock - quantity);

    const refundResponse = await ctx.agent
      .post(`/orders/${orderId}/refund`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    assert.equal(refundResponse.body.refund.orderId, orderId);
    assert.equal(refundResponse.body.refund.ticketsCancelled, quantity);
    assert.equal(refundResponse.body.refund.stockRestored, quantity);

    const refundedOrder = await ctx.agent
      .get("/orders/me")
      .set("Authorization", `Bearer ${clientToken}`)
      .expect(200);

    assert.equal(refundedOrder.body.orders[0].status, OrderStatus.REFUNDED);

    const tickets = await ctx.dataSource.getRepository(Ticket).find({
      where: { orderId },
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

  it("refunds manual paymentGatewayId without calling Mercado Pago", async () => {
    const producer = await createUser(ctx.dataSource, {
      name: "Producer Manual",
      email: "producer-refund-manual@test.com",
      password: TEST_USER_PASSWORD,
      document: "19191919191",
      role: UserRole.PRODUCER,
    });

    const admin = await createUser(ctx.dataSource, {
      name: "Admin Manual",
      email: "admin-refund-manual@test.com",
      password: TEST_USER_PASSWORD,
      document: "20202020202",
      role: UserRole.ADMIN,
    });

    const client = await createUser(ctx.dataSource, {
      name: "Client Manual",
      email: "client-refund-manual@test.com",
      password: TEST_USER_PASSWORD,
      document: "21212121212",
    });

    const adminToken = await login(ctx.agent, admin.email, admin.password);
    const clientToken = await login(ctx.agent, client.email, client.password);
    const { lot } = await createPublishedEventWithLot(ctx.dataSource, producer.id, 5);

    const reserveResponse = await ctx.agent
      .post("/purchases/reserve")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ ticketLotId: lot.id, quantity: 1 })
      .expect(201);

    const reservationId = reserveResponse.body.reservation.id as string;
    const { orderId } = await payOrderViaWebhook(ctx, clientToken, reservationId);

    await ctx.dataSource.getRepository(Order).update(orderId, {
      paymentGatewayId: "manual:test-courtesy-id",
    });

    const refundResponse = await ctx.agent
      .post(`/orders/${orderId}/refund`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    assert.equal(refundResponse.body.refund.ticketsCancelled, 1);

    const order = await ctx.dataSource.getRepository(Order).findOneByOrFail({
      id: orderId,
    });
    assert.equal(order.status, OrderStatus.REFUNDED);
  });

  it("applies local refund from payment.refunded webhook on PAID order", async () => {
    const producer = await createUser(ctx.dataSource, {
      name: "Producer Webhook",
      email: "producer-refund-webhook@test.com",
      password: TEST_USER_PASSWORD,
      document: "22222222222",
      role: UserRole.PRODUCER,
    });

    const client = await createUser(ctx.dataSource, {
      name: "Client Webhook",
      email: "client-refund-webhook@test.com",
      password: TEST_USER_PASSWORD,
      document: "23232323232",
    });

    const clientToken = await login(ctx.agent, client.email, client.password);
    const { lot } = await createPublishedEventWithLot(ctx.dataSource, producer.id, 4);

    const reserveResponse = await ctx.agent
      .post("/purchases/reserve")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ ticketLotId: lot.id, quantity: 1 })
      .expect(201);

    const reservationId = reserveResponse.body.reservation.id as string;
    const { orderId, transactionId } = await payOrderViaWebhook(
      ctx,
      clientToken,
      reservationId,
    );

    const refundWebhook = {
      event: "payment.refunded" as const,
      data: {
        orderId,
        transactionId,
        failureReason: "refunded",
      },
    };

    const signed = signInternalWebhookPayload({
      secret: TEST_WEBHOOK_SECRET,
      body: refundWebhook,
    });

    await ctx.agent
      .post("/payments/webhook")
      .set("Content-Type", "application/json")
      .set("x-webhook-timestamp", signed.timestamp)
      .set("x-webhook-signature", signed.signature)
      .send(JSON.parse(signed.body))
      .expect(202);

    let refunded = false;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const order = await ctx.dataSource.getRepository(Order).findOneBy({
        id: orderId,
      });
      if (order?.status === OrderStatus.REFUNDED) {
        refunded = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    assert.equal(refunded, true, "Order should become REFUNDED after webhook");

    const tickets = await ctx.dataSource.getRepository(Ticket).find({
      where: { orderId },
    });
    assert.ok(tickets.every((ticket) => ticket.status === TicketStatus.CANCELLED));

    const lotAfter = await ctx.dataSource
      .getRepository(TicketLot)
      .findOneByOrFail({ id: lot.id });
    assert.equal(lotAfter.availableQuantity, 4);
  });

  it("allows event producer to refund own order and denies other producer", async () => {
    const owner = await createUser(ctx.dataSource, {
      name: "Owner Producer",
      email: "owner-producer-refund@test.com",
      password: TEST_USER_PASSWORD,
      document: "24242424242",
      role: UserRole.PRODUCER,
    });

    const otherProducer = await createUser(ctx.dataSource, {
      name: "Other Producer",
      email: "other-producer-refund@test.com",
      password: TEST_USER_PASSWORD,
      document: "25252525252",
      role: UserRole.PRODUCER,
    });

    const client = await createUser(ctx.dataSource, {
      name: "Client Producer ACL",
      email: "client-producer-acl@test.com",
      password: TEST_USER_PASSWORD,
      document: "26262626262",
    });

    const ownerToken = await login(ctx.agent, owner.email, owner.password);
    const otherToken = await login(ctx.agent, otherProducer.email, otherProducer.password);
    const clientToken = await login(ctx.agent, client.email, client.password);

    const { lot } = await createPublishedEventWithLot(ctx.dataSource, owner.id, 3);

    const reserveResponse = await ctx.agent
      .post("/purchases/reserve")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ ticketLotId: lot.id, quantity: 1 })
      .expect(201);

    const reservationId = reserveResponse.body.reservation.id as string;
    const { orderId } = await payOrderViaWebhook(ctx, clientToken, reservationId);

    await ctx.agent
      .post(`/orders/${orderId}/refund`)
      .set("Authorization", `Bearer ${otherToken}`)
      .expect(403);

    const refundResponse = await ctx.agent
      .post(`/orders/${orderId}/refund`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .expect(200);

    assert.equal(refundResponse.body.refund.orderId, orderId);
    assert.equal(refundResponse.body.refund.ticketsCancelled, 1);
  });

  it("rejects refund for client users", async () => {
    const producer = await createUser(ctx.dataSource, {
      name: "Producer",
      email: "producer-refund-deny@test.com",
      password: TEST_USER_PASSWORD,
      document: "17171717171",
      role: UserRole.PRODUCER,
    });

    const client = await createUser(ctx.dataSource, {
      name: "Client",
      email: "client-refund-deny@test.com",
      password: TEST_USER_PASSWORD,
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
