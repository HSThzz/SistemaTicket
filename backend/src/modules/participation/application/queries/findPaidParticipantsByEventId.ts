/**
 * @file Query: pedidos pagos de um evento com dados do comprador.
 * @module modules/participation/application/queries/findPaidParticipantsByEventId
 */

import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { ParticipationRequest } from "../../../../shared/infrastructure/persistence/entities/ParticipationRequest";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { OrderStatus } from "../../../../shared/kernel/enums";

export type PaidParticipantRow = {
  orderId: string;
  userId: string;
  name: string;
  email: string;
  totalPriceCents: number;
  ticketCount: number;
  paidAt: Date;
  instagramHandle: string | null;
};

/**
 * Lista um item por pedido PAID do evento, enriquecido com Instagram da solicitação.
 */
export async function findPaidParticipantsByEventId(
  eventId: string,
): Promise<PaidParticipantRow[]> {
  const rawRows = await AppDataSource.getRepository(Order)
    .createQueryBuilder("ord")
    .innerJoin("ord.user", "user")
    .innerJoin("ord.tickets", "ticket")
    .innerJoin("ticket.ticketLot", "lot")
    .where("lot.eventId = :eventId", { eventId })
    .andWhere("ord.status = :status", { status: OrderStatus.PAID })
    .select("ord.id", "orderId")
    .addSelect("ord.userId", "userId")
    .addSelect("user.name", "name")
    .addSelect("user.email", "email")
    .addSelect("ord.totalPrice", "totalPriceCents")
    .addSelect("ord.createdAt", "paidAt")
    .addSelect("COUNT(ticket.id)", "ticketCount")
    .groupBy("ord.id")
    .addGroupBy("ord.userId")
    .addGroupBy("user.name")
    .addGroupBy("user.email")
    .addGroupBy("ord.totalPrice")
    .addGroupBy("ord.createdAt")
    .orderBy("ord.createdAt", "DESC")
    .getRawMany<{
      orderId: string;
      userId: string;
      name: string;
      email: string;
      totalPriceCents: string;
      paidAt: Date;
      ticketCount: string;
    }>();

  if (rawRows.length === 0) {
    return [];
  }

  const userIds = [...new Set(rawRows.map((row) => row.userId))];

  const participationRows = await AppDataSource.getRepository(ParticipationRequest)
    .createQueryBuilder("request")
    .select("request.userId", "userId")
    .addSelect("request.instagramHandle", "instagramHandle")
    .where("request.eventId = :eventId", { eventId })
    .andWhere("request.userId IN (:...userIds)", { userIds })
    .getRawMany<{ userId: string; instagramHandle: string | null }>();

  const instagramByUserId = new Map(
    participationRows.map((row) => [row.userId, row.instagramHandle ?? null]),
  );

  return rawRows.map((row) => ({
    orderId: row.orderId,
    userId: row.userId,
    name: row.name,
    email: row.email,
    totalPriceCents: Number(row.totalPriceCents),
    ticketCount: Number(row.ticketCount),
    paidAt: row.paidAt instanceof Date ? row.paidAt : new Date(row.paidAt),
    instagramHandle: instagramByUserId.get(row.userId) ?? null,
  }));
}
