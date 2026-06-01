/**
 * @file Definição e execução do seed de demonstração (usuários, eventos, ingressos).
 * @module seeds/demo-seed
 */

import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import { TICKET_LOT_STOCK_KEY_PREFIX } from "../shared/infrastructure/config/constants";
import { Event } from "../shared/infrastructure/persistence/entities/Event";
import { Order } from "../shared/infrastructure/persistence/entities/Order";
import { Reservation } from "../shared/infrastructure/persistence/entities/Reservation";
import { Ticket } from "../shared/infrastructure/persistence/entities/Ticket";
import { TicketLot } from "../shared/infrastructure/persistence/entities/TicketLot";
import { User } from "../shared/infrastructure/persistence/entities/User";
import {
  EventStatus,
  OrderStatus,
  ReservationStatus,
  TicketStatus,
  UserRole,
} from "../shared/kernel/enums";

/** Senha padrão de todos os usuários criados pelo seed. */
export const SEED_PASSWORD = "123456";
const BCRYPT_ROUNDS = 12;

/**
 * URLs de imagens de exemplo (Unsplash) indexadas por tema do evento.
 */
export const SEED_EVENT_IMAGES = {
  festival: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=675&fit=crop&q=80",
  comedy: "https://images.unsplash.com/photo-1527228510675-8c9976d9abc2?w=1200&h=675&fit=crop&q=80",
  rock: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=675&fit=crop&q=80",
  jazz: "https://images.unsplash.com/photo-1415201364774-f6f0ff50a827?w=1200&h=675&fit=crop&q=80",
  conference: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=675&fit=crop&q=80",
  food: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&h=675&fit=crop&q=80",
  theater: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&h=675&fit=crop&q=80",
  marathon: "https://images.unsplash.com/photo-1459959639115-2a8585cb907f?w=1200&h=675&fit=crop&q=80",
  electronic: "https://images.unsplash.com/photo-1514525253161-7a46ce19fcc7?w=1200&h=675&fit=crop&q=80",
  orchestra: "https://images.unsplash.com/photo-1460894276352-46aa08585356?w=1200&h=675&fit=crop&q=80",
  workshop: "https://images.unsplash.com/photo-1505373877918-8a25bd070443?w=1200&h=675&fit=crop&q=80",
  gaming: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=675&fit=crop&q=80",
} as const;

interface SeedLotDef {
  name: string;
  price: number;
  totalQuantity: number;
  availableQuantity?: number;
}

interface SeedEventDef {
  title: string;
  description: string;
  daysFromNow: number;
  location: string;
  status: EventStatus;
  imageUrl: string;
  lots: SeedLotDef[];
}

const SEED_EVENTS: SeedEventDef[] = [
  {
    title: "Festival TicketFlow 2026",
    description:
      "O maior festival de demonstração da plataforma. Música, food trucks e experiências imersivas ao ar livre.",
    daysFromNow: 14,
    location: "Parque Ibirapuera — São Paulo, SP",
    status: EventStatus.PUBLISHED,
    imageUrl: SEED_EVENT_IMAGES.festival,
    lots: [
      { name: "Pista", price: 8_000, totalQuantity: 500, availableQuantity: 498 },
      { name: "VIP", price: 25_000, totalQuantity: 100 },
    ],
  },
  {
    title: "Stand-up Comedy Night",
    description: "Noite de comédia stand-up com artistas convidados. Classificação 16 anos.",
    daysFromNow: 5,
    location: "Teatro Municipal — Rio de Janeiro, RJ",
    status: EventStatus.PUBLISHED,
    imageUrl: SEED_EVENT_IMAGES.comedy,
    lots: [{ name: "Geral", price: 4_500, totalQuantity: 150, availableQuantity: 149 }],
  },
  {
    title: "Rock Nacional ao Vivo",
    description: "Uma noite eletrizante com as maiores bandas de rock do Brasil. Som de qualidade e produção premium.",
    daysFromNow: 3,
    location: "Mineirão Arena — Belo Horizonte, MG",
    status: EventStatus.PUBLISHED,
    imageUrl: SEED_EVENT_IMAGES.rock,
    lots: [
      { name: "Pista", price: 12_000, totalQuantity: 800, availableQuantity: 650 },
      { name: "Front Stage", price: 28_000, totalQuantity: 200, availableQuantity: 120 },
    ],
  },
  {
    title: "Noite de Jazz & Vinho",
    description: "Experiência intimista com jazz ao vivo, harmonização de vinhos e ambiente sofisticado.",
    daysFromNow: 8,
    location: "Espaço Cultural — São Paulo, SP",
    status: EventStatus.PUBLISHED,
    imageUrl: SEED_EVENT_IMAGES.jazz,
    lots: [{ name: "Mesa", price: 18_000, totalQuantity: 80, availableQuantity: 45 }],
  },
  {
    title: "Tech Summit Brasil 2026",
    description: "Conferência com palestras de IA, cloud e produto. Networking com líderes da indústria tech.",
    daysFromNow: 21,
    location: "Expo Center Norte — São Paulo, SP",
    status: EventStatus.PUBLISHED,
    imageUrl: SEED_EVENT_IMAGES.conference,
    lots: [
      { name: "Full Pass", price: 35_000, totalQuantity: 300, availableQuantity: 220 },
      { name: "Estudante", price: 15_000, totalQuantity: 100, availableQuantity: 88 },
    ],
  },
  {
    title: "Festival Gastronômico Curitiba",
    description: "Chefs renomados, food trucks criativos e degustações especiais em um fim de semana inesquecível.",
    daysFromNow: 12,
    location: "Parque Barigui — Curitiba, PR",
    status: EventStatus.PUBLISHED,
    imageUrl: SEED_EVENT_IMAGES.food,
    lots: [
      { name: "Diária", price: 6_500, totalQuantity: 400, availableQuantity: 310 },
      { name: "Passaporte 2 dias", price: 11_000, totalQuantity: 250, availableQuantity: 180 },
    ],
  },
  {
    title: "Hamlet — Temporada de Inverno",
    description: "Produção clássica de Shakespeare com elenco premiado e cenografia imersiva.",
    daysFromNow: 10,
    location: "Teatro São Pedro — Porto Alegre, RS",
    status: EventStatus.PUBLISHED,
    imageUrl: SEED_EVENT_IMAGES.theater,
    lots: [
      { name: "Plateia", price: 9_000, totalQuantity: 220, availableQuantity: 165 },
      { name: "Balcão", price: 5_500, totalQuantity: 120, availableQuantity: 95 },
    ],
  },
  {
    title: "Maratona City Run 10K",
    description: "Corrida urbana com kit atleta, hidratação e medalha finisher. Percurso certificado pela CBAt.",
    daysFromNow: 6,
    location: "Parque Villa-Lobos — São Paulo, SP",
    status: EventStatus.PUBLISHED,
    imageUrl: SEED_EVENT_IMAGES.marathon,
    lots: [{ name: "Inscrição", price: 7_500, totalQuantity: 1_000, availableQuantity: 720 }],
  },
  {
    title: "Sunset Electronic Fest",
    description: "DJs nacionais e internacionais em um pôr do sol épico à beira-mar. Open bar nos setores VIP.",
    daysFromNow: 4,
    location: "Praia de Copacabana — Rio de Janeiro, RJ",
    status: EventStatus.PUBLISHED,
    imageUrl: SEED_EVENT_IMAGES.electronic,
    lots: [
      { name: "Open Air", price: 14_000, totalQuantity: 600, availableQuantity: 420 },
      { name: "VIP Lounge", price: 32_000, totalQuantity: 150, availableQuantity: 80 },
    ],
  },
  {
    title: "Orquestra Sinfônica — Temporada de Inverno",
    description: "Repertório de Beethoven e Tchaikovsky sob regência convidada. Dress code smart casual.",
    daysFromNow: 18,
    location: "Sala São Paulo — São Paulo, SP",
    status: EventStatus.PUBLISHED,
    imageUrl: SEED_EVENT_IMAGES.orchestra,
    lots: [
      { name: "Plateia Central", price: 22_000, totalQuantity: 180, availableQuantity: 140 },
      { name: "Frisas", price: 16_000, totalQuantity: 90, availableQuantity: 70 },
    ],
  },
  {
    title: "Workshop Dev (rascunho)",
    description: "Evento em rascunho para testar o painel do produtor antes de publicar.",
    daysFromNow: 30,
    location: "Online — Zoom",
    status: EventStatus.DRAFT,
    imageUrl: SEED_EVENT_IMAGES.workshop,
    lots: [{ name: "Early Bird", price: 12_000, totalQuantity: 50 }],
  },
  {
    title: "Gaming Cup Online (rascunho)",
    description: "Campeonato de e-sports em formato online. Em preparação para publicação.",
    daysFromNow: 45,
    location: "Online — Twitch",
    status: EventStatus.DRAFT,
    imageUrl: SEED_EVENT_IMAGES.gaming,
    lots: [{ name: "Inscrição Equipe", price: 8_000, totalQuantity: 64 }],
  },
];

/**
 * Resumo retornado após execução do seed para logs e CLI.
 */
export interface SeedSummary {
  users: Array<{ email: string; role: UserRole; password: string }>;
  events: Array<{ title: string; status: EventStatus; lots: number }>;
  sampleTickets: number;
}

/**
 * Limpa tabelas principais e reinicia sequences (CASCADE).
 * @param dataSource - Conexão TypeORM inicializada.
 */
export async function resetDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.query(`
    TRUNCATE tickets, orders, reservations, ticket_lots, events, users
    RESTART IDENTITY CASCADE
  `);
}

/**
 * Esvazia o banco Redis atual (`FLUSHDB`).
 * @param redis - Cliente Redis conectado.
 */
export async function resetRedis(redis: Redis): Promise<void> {
  await redis.flushdb();
}

/**
 * Cria usuários demo, eventos, lotes, pedidos pagos de exemplo e sincroniza estoque Redis.
 * @param dataSource - Conexão TypeORM.
 * @param redis - Cliente Redis para chaves de estoque por lote.
 * @returns Resumo com usuários, eventos e contagem de ingressos de amostra.
 */
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
  const createdEvents: Event[] = [];
  const createdLots: TicketLot[] = [];

  for (const def of SEED_EVENTS) {
    const event = await eventRepo.save(
      eventRepo.create({
        producerId: producer.id,
        title: def.title,
        description: def.description,
        date: daysFromNow(def.daysFromNow),
        location: def.location,
        imageUrl: def.imageUrl,
        status: def.status,
      }),
    );

    createdEvents.push(event);

    for (const lotDef of def.lots) {
      const lot = await lotRepo.save(
        lotRepo.create({
          eventId: event.id,
          name: lotDef.name,
          price: lotDef.price,
          totalQuantity: lotDef.totalQuantity,
          availableQuantity: lotDef.availableQuantity ?? lotDef.totalQuantity,
        }),
      );
      createdLots.push(lot);
    }
  }

  const festival = createdEvents.find((event) => event.title === "Festival TicketFlow 2026")!;
  const comedy = createdEvents.find((event) => event.title === "Stand-up Comedy Night")!;
  const festivalPista = createdLots.find(
    (lot) => lot.eventId === festival.id && lot.name === "Pista",
  )!;
  const comedyGeral = createdLots.find(
    (lot) => lot.eventId === comedy.id && lot.name === "Geral",
  )!;

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

  const publishedLots = createdLots.filter((lot) => {
    const event = createdEvents.find((item) => item.id === lot.eventId);
    return event?.status === EventStatus.PUBLISHED;
  });
  await syncRedisStock(redis, publishedLots);

  return {
    users: [
      { email: admin.email, role: admin.role, password: SEED_PASSWORD },
      { email: producer.email, role: producer.role, password: SEED_PASSWORD },
      { email: client.email, role: client.role, password: SEED_PASSWORD },
    ],
    events: createdEvents.map((event) => ({
      title: event.title,
      status: event.status,
      lots: createdLots.filter((lot) => lot.eventId === event.id).length,
    })),
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
