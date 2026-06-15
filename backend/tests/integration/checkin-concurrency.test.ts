import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, before, beforeEach, describe, it } from "node:test";
import { Event } from "../../src/shared/infrastructure/persistence/entities/Event";
import { Order } from "../../src/shared/infrastructure/persistence/entities/Order";
import { Reservation } from "../../src/shared/infrastructure/persistence/entities/Reservation";
import { Ticket } from "../../src/shared/infrastructure/persistence/entities/Ticket";
import { TicketLot } from "../../src/shared/infrastructure/persistence/entities/TicketLot";
import { checkIn } from "../../src/modules/ticketing/application/services/checkIn";
import { InvalidTicketStatusError } from "../../src/modules/ticketing/domain/errors/CheckInError";
import {
  EventStatus,
  OrderStatus,
  ReservationStatus,
  TicketStatus,
  UserRole,
} from "../../src/shared/kernel/enums";
import { createUser } from "../helpers/fixtures";
import {
  resetTestState,
  setupTestContext,
  teardownTestContext,
  type TestContext,
} from "../helpers/testContext";

describe("Check-in concurrency", () => {
  let ctx: TestContext;

  before(async () => {
    ctx = await setupTestContext({ startWorker: false });
  });

  after(async () => {
    await teardownTestContext(ctx);
  });

  beforeEach(async () => {
    await resetTestState(ctx);
  });

  it("allows only one successful check-in under concurrent scans", async () => {
    const producer = await createUser(ctx.dataSource, {
      name: "Producer",
      email: "producer-checkin@test.com",
      password: "pass123",
      document: "12121212121",
      role: UserRole.PRODUCER,
    });

    const client = await createUser(ctx.dataSource, {
      name: "Client",
      email: "client-checkin@test.com",
      password: "pass123",
      document: "34343434343",
    });

    const eventRepo = ctx.dataSource.getRepository(Event);
    const lotRepo = ctx.dataSource.getRepository(TicketLot);
    const reservationRepo = ctx.dataSource.getRepository(Reservation);
    const orderRepo = ctx.dataSource.getRepository(Order);
    const ticketRepo = ctx.dataSource.getRepository(Ticket);

    const event = await eventRepo.save(
      eventRepo.create({
        producerId: producer.id,
        title: "Show Hoje",
        description: "Evento no dia do check-in",
        date: new Date(),
        location: "Arena",
        status: EventStatus.PUBLISHED,
      }),
    );

    const lot = await lotRepo.save(
      lotRepo.create({
        eventId: event.id,
        name: "Pista",
        price: 5000,
        totalQuantity: 1,
        availableQuantity: 0,
      }),
    );

    const reservation = await reservationRepo.save(
      reservationRepo.create({
        userId: client.id,
        ticketLotId: lot.id,
        quantity: 1,
        status: ReservationStatus.COMPLETED,
        expiresAt: new Date(Date.now() + 60_000),
      }),
    );

    const order = await orderRepo.save(
      orderRepo.create({
        userId: client.id,
        reservationId: reservation.id,
        totalPrice: lot.price,
        status: OrderStatus.PAID,
        paymentGatewayId: "pix_test",
      }),
    );

    const uniqueCode = randomBytes(16).toString("hex");

    await ticketRepo.save(
      ticketRepo.create({
        orderId: order.id,
        ticketLotId: lot.id,
        ownerName: "Cliente Check-in",
        ownerDocument: "99999999999",
        uniqueCode,
        status: TicketStatus.ACTIVE,
      }),
    );

    const attempts = 20;
    const results = await Promise.allSettled(
      Array.from({ length: attempts }, () =>
        checkIn(uniqueCode, { userId: producer.id, role: UserRole.PRODUCER }),
      ),
    );

    const successes = results.filter((result) => result.status === "fulfilled");
    const failures = results.filter((result) => result.status === "rejected");

    assert.equal(successes.length, 1);
    assert.equal(failures.length, attempts - 1);

    for (const failure of failures) {
      assert.equal(failure.status, "rejected");
      if (failure.status === "rejected") {
        assert.ok(failure.reason instanceof InvalidTicketStatusError);
      }
    }

    const ticket = await ticketRepo.findOneBy({ uniqueCode });
    assert.equal(ticket?.status, TicketStatus.USED);
    assert.ok(ticket?.checkedInAt);
  });
});
