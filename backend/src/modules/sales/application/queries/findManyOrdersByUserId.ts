/**
 * @file Query: lista pedidos de um usuário com paginação por cursor.
 * @module modules/sales/application/queries/findManyOrdersByUserId
 */

import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import {
  applyPagination,
  fetchCursorPage,
} from "../../../../shared/infrastructure/persistence/helpers/applyPagination";
import {
  applyOrderListFilters,
  type OrderListFilters,
} from "../helpers/applyOrderListFilters";

export interface FindManyOrdersByUserIdParams {
  userId: string;
  limit: number;
  cursor?: string;
  filters?: OrderListFilters;
}

export interface FindManyOrdersByUserIdResult {
  orders: Order[];
  hasNextPage: boolean;
  nextCursor: string | null;
}

export async function findManyOrdersByUserId(
  params: FindManyOrdersByUserIdParams,
): Promise<FindManyOrdersByUserIdResult> {
  const { userId, limit, cursor, filters } = params;

  let queryBuilder = AppDataSource.getRepository(Order)
    .createQueryBuilder("order")
    .leftJoinAndSelect("order.reservation", "reservation")
    .leftJoinAndSelect("reservation.ticketLot", "ticketLot")
    .leftJoinAndSelect("ticketLot.event", "event")
    .where("order.userId = :userId", { userId });

  queryBuilder = applyOrderListFilters(queryBuilder, filters);
  queryBuilder = applyPagination(queryBuilder, { limit, cursor }, { alias: "order" });

  const page = await fetchCursorPage(queryBuilder, limit);

  return {
    orders: page.items,
    hasNextPage: page.hasNextPage,
    nextCursor: page.nextCursor,
  };
}
