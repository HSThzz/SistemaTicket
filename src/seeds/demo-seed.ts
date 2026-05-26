import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import { TICKET_LOT_STOCK_KEY_PREFIX } from "../config/constants";
import { Event } from "../entities/Event";
import { Order } from "../entities/Order";
import { Reservation } from "../entities/Reservation";
import { Ticket } from "../entities/Ticket";
import { TicketLot } from "../entities/TicketLot";
import { User } from "../entities/User";
import {
  EventStatus,
  OrderStatus,
  ReservationStatus,
  TicketStatus,
  UserRole,
} from "../entities/enums";

export const SEED_PASSWORD = "123456";
const BCRYPT_ROUNDS = 12;

export interface SeedSummary {
  users: Array<{ email: string; role: UserRole; password: string }>;
  events: Array<{ title: string; status: EventStatus; lots: number }>;
  sampleTickets: number;
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

export async function runDemoSeed(
  dataSource: DataSource,
  redis: Redis,
): Promise<SeedSummary> {
  const userRepo = dataSource.getRepository(User);
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);

  const admin = await userRepo.save(
    userRepo.create({
      name: "Admin TicketFlow",
      email: "admin@ticketflow.test",
      passwordHash,
      document: "10000000001",
      role: UserRole.ADMIN,
    }),
  );

  const producer = await userRepo.save(
    userRepo.create({
      name: "Produtor Demo",
      email: "producer@ticketflow.test",
      passwordHash,
      document: "20000000002",
      role: UserRole.PRODUCER,
    }),
  );

  const client = await userRepo.save(
    userRepo.create({
      name: "Cliente Demo",
      email: "client@ticketflow.test",
      passwordHash,
      document: "30000000003",
      role: UserRole.CLIENT,
    }),
  );

  const eventRepo = dataSource.getRepository(Event);
  const lotRepo = dataSource.getRepository(TicketLot);

  const festival = await eventRepo.save(
    eventRepo.create({
      producerId: producer.id,
      title: "Festival TicketFlow 2026",
      description:
        "O maior festival de demonstração da plataforma. Música, food trucks e experiências imersivas.",
      date: daysFromNow(14),
      location: "Parque Ibirapuera — São Paulo, SP",
      status: EventStatus.PUBLISHED,
    }),
  );

  const festivalPista = await lotRepo.save(
    lotRepo.create({
      eventId: festival.id,
      name: "Pista",
      price: 8_000,
      totalQuantity: 500,
      availableQuantity: 498,
    }),
  );

  await lotRepo.save(
    lotRepo.create({
      eventId: festival.id,
      name: "VIP",
      price: 25_000,
      totalQuantity: 100,
      availableQuantity: 100,
    }),
  );

  const comedy = await eventRepo.save(
    eventRepo.create({
      producerId: producer.id,
      title: "Stand-up Comedy Night",
      description: "Noite de comédia stand-up com artistas convidados. Classificação 16 anos.",
      date: daysFromNow(5),
      location: "Teatro Municipal — Rio de Janeiro, RJ",
      status: EventStatus.PUBLISHED,
    }),
  );

  const comedyGeral = await lotRepo.save(
    lotRepo.create({
      eventId: comedy.id,
      name: "Geral",
      price: 4_500,
      totalQuantity: 150,
      availableQuantity: 149,
    }),
  );

  const workshop = await eventRepo.save(
    eventRepo.create({
      producerId: producer.id,
      title: "Workshop Dev (rascunho)",
      description: "Evento em rascunho para testar o painel do produtor antes de publicar.",
      date: daysFromNow(30),
      location: "Online — Zoom",
      status: EventStatus.DRAFT,
    }),
  );

  await lotRepo.save(
    lotRepo.create({
      eventId: workshop.id,
      name: "Early Bird",
      price: 12_000,
      totalQuantity: 50,
      availableQuantity: 50,
    }),
  );

  await seedPaidOrder(dataSource, {
    user: client,
    lot: festivalPista,
    quantity: 2,
    ticketStatuses: [TicketStatus.ACTIVE, TicketStatus.ACTIVE],
  });

  await seedPaidOrder(dataSource, {
    user: client,
    lot: comedyGeral,
    quantity: 1,
    ticketStatuses: [TicketStatus.USED],
    checkedInAt: new Date(),
  });

  const publishedLots = await lotRepo.find({
    where: [{ eventId: festival.id }, { eventId: comedy.id }],
  });
  await syncRedisStock(redis, publishedLots);

  return {
    users: [
      { email: admin.email, role: admin.role, password: SEED_PASSWORD },
      { email: producer.email, role: producer.role, password: SEED_PASSWORD },
      { email: client.email, role: client.role, password: SEED_PASSWORD },
    ],
    events: [
      { title: festival.title, status: festival.status, lots: 2 },
      { title: comedy.title, status: comedy.status, lots: 1 },
      { title: workshop.title, status: workshop.status, lots: 1 },
    ],
    sampleTickets: 3,
  };
}

async function seedPaidOrder(
  dataSource: DataSource,
  params: {
    user: User;
    lot: TicketLot;
    quantity: number;
    ticketStatuses: TicketStatus[];
    checkedInAt?: Date;
  },
): Promise<void> {
  const reservationRepo = dataSource.getRepository(Reservation);
  const orderRepo = dataSource.getRepository(Order);
  const ticketRepo = dataSource.getRepository(Ticket);

  const reservation = await reservationRepo.save(
    reservationRepo.create({
      userId: params.user.id,
      ticketLotId: params.lot.id,
      quantity: params.quantity,
      status: ReservationStatus.COMPLETED,
      expiresAt: daysFromNow(1),
    }),
  );

  const order = await orderRepo.save(
    orderRepo.create({
      userId: params.user.id,
      reservationId: reservation.id,
      totalPrice: params.lot.price * params.quantity,
      status: OrderStatus.PAID,
      paymentGatewayId: `pix_sim_seed_${reservation.id.slice(0, 8)}`,
    }),
  );

  for (let index = 0; index < params.quantity; index += 1) {
    const status = params.ticketStatuses[index] ?? TicketStatus.ACTIVE;
    await ticketRepo.save(
      ticketRepo.create({
        orderId: order.id,
        ticketLotId: params.lot.id,
        ownerName: params.user.name,
        ownerDocument: params.user.document,
        uniqueCode: randomBytes(32).toString("hex"),
        status,
        checkedInAt: status === TicketStatus.USED ? (params.checkedInAt ?? new Date()) : null,
      }),
    );
  }
}

async function syncRedisStock(redis: Redis, lots: TicketLot[]): Promise<void> {
  for (const lot of lots) {
    await redis.set(`${TICKET_LOT_STOCK_KEY_PREFIX}${lot.id}`, String(lot.availableQuantity));
  }
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(20, 0, 0, 0);
  return date;
}
