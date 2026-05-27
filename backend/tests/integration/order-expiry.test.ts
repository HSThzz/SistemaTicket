import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import { TICKET_LOT_STOCK_KEY_PREFIX } from "../../src/config/constants";
import { Order } from "../../src/entities/Order";
import { Reservation } from "../../src/entities/Reservation";
import { TicketLot } from "../../src/entities/TicketLot";
import {
  OrderStatus,
  ReservationStatus,
  UserRole,
} from "../../src/entities/enums";
import { PaymentService } from "../../src/services/PaymentService";
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

describe("Order expiry integration", () => {
  let ctx: TestContext;
  let paymentService: PaymentService;

  before(async () => {
    ctx = await setupTestContext();
    paymentService = new PaymentService(ctx.dataSource, ctx.redis);
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
      password: "pass123",
      document: "12121212121",
      role: UserRole.PRODUCER,
    });

    const client = await createUser(ctx.dataSource, {
      name: "Client",
      email: "client-expiry@test.com",
      password: "pass123",
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

    const awaitingPayment = await pollReservationPhase(
      ctx.agent,
      clientToken,
      reservationId,
      "AWAITING_PAYMENT",
    );

    const orderId = (awaitingPayment.order as { id: string }).id;

    const lotBeforeExpiry = await ctx.dataSource
      .getRepository(TicketLot)
      .findOneByOrFail({ id: lot.id });
    assert.equal(lotBeforeExpiry.availableQuantity, initialStock - quantity);

    const expired = await paymentService.expireUnpaidOrderByReservationId(
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
});
