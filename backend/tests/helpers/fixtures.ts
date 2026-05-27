import bcrypt from "bcrypt";
import type { DataSource } from "typeorm";
import { Event } from "../../src/entities/Event";
import { TicketLot } from "../../src/entities/TicketLot";
import { User } from "../../src/entities/User";
import { EventStatus, UserRole } from "../../src/entities/enums";

const BCRYPT_ROUNDS = 4;

export interface TestUser {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  token?: string;
}

export interface TestEventFixture {
  event: Event;
  lot: TicketLot;
}

export async function createUser(
  dataSource: DataSource,
  params: {
    name: string;
    email: string;
    password: string;
    document: string;
    role?: UserRole;
  },
): Promise<TestUser> {
  const repository = dataSource.getRepository(User);
  const passwordHash = await bcrypt.hash(params.password, BCRYPT_ROUNDS);

  const user = repository.create({
    name: params.name,
    email: params.email.toLowerCase(),
    passwordHash,
    document: params.document,
    role: params.role ?? UserRole.CLIENT,
  });

  const saved = await repository.save(user);

  return {
    id: saved.id,
    email: saved.email,
    password: params.password,
    role: saved.role,
  };
}

export async function login(
  agent: ReturnType<typeof import("supertest")>,
  email: string,
  password: string,
): Promise<string> {
  const response = await agent
    .post("/auth/login")
    .send({ email, password })
    .expect(200);

  return response.body.token as string;
}

export async function createPublishedEventWithLot(
  dataSource: DataSource,
  producerId: string,
  stock: number,
): Promise<TestEventFixture> {
  const eventRepository = dataSource.getRepository(Event);
  const lotRepository = dataSource.getRepository(TicketLot);

  const event = await eventRepository.save(
    eventRepository.create({
      producerId,
      title: "Evento Teste",
      description: "Descrição do evento de teste",
      date: new Date(Date.now() + 24 * 60 * 60 * 1000),
      location: "Arena Teste",
      status: EventStatus.PUBLISHED,
    }),
  );

  const lot = await lotRepository.save(
    lotRepository.create({
      eventId: event.id,
      name: "Lote Teste",
      price: 5000,
      totalQuantity: stock,
      availableQuantity: stock,
    }),
  );

  return { event, lot };
}

export async function pollReservationPhase(
  agent: ReturnType<typeof import("supertest")>,
  token: string,
  reservationId: string,
  expectedPhase: string,
  timeoutMs = 15_000,
): Promise<Record<string, unknown>> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const response = await agent
      .get(`/purchases/reservations/${reservationId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    if (response.body.phase === expectedPhase) {
      return response.body as Record<string, unknown>;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Timeout waiting for reservation phase ${expectedPhase}`);
}
