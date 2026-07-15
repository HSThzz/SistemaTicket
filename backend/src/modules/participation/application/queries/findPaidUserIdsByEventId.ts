/**
 * @file Query: IDs de usuários com pedido PAID no evento.
 * @module modules/participation/application/queries/findPaidUserIdsByEventId
 */

import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { OrderStatus } from "../../../../shared/kernel/enums";

export async function findPaidUserIdsByEventId(
  eventId: string,
): Promise<Set<string>> {
  const rows = await AppDataSource.getRepository(Order)
    .createQueryBuilder("ord")
    .innerJoin("ord.tickets", "ticket")
    .innerJoin("ticket.ticketLot", "lot")
    .where("lot.eventId = :eventId", { eventId })
    .andWhere("ord.status = :status", { status: OrderStatus.PAID })
    .select("ord.userId", "userId")
    .groupBy("ord.userId")
    .getRawMany<{ userId: string }>();

  return new Set(rows.map((row) => row.userId));
}
