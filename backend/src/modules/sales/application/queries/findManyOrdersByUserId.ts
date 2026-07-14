/**
 * @file Query: lista pedidos de um usuário com paginação por cursor (mais recentes primeiro).
 * @module modules/sales/application/queries/findManyOrdersByUserId
 */

import { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
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

/** Cursor composto: `{createdAtIso}|{orderId}`. */
function encodeOrderCursor(createdAt: Date, id: string): string {
  return `${createdAt.toISOString()}|${id}`;
}

function decodeOrderCursor(
  cursor: string,
): { createdAt: Date; id: string } | null {
  const separator = cursor.lastIndexOf("|");
  if (separator <= 0) {
    return null;
  }

  const createdAtIso = cursor.slice(0, separator);
  const id = cursor.slice(separator + 1);
  const createdAt = new Date(createdAtIso);

  if (!id || Number.isNaN(createdAt.getTime())) {
    return null;
  }

  return { createdAt, id };
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
    .where("order.userId = :userId", { userId })
    .orderBy("order.createdAt", "DESC")
    .addOrderBy("order.id", "DESC")
    .take(limit + 1);

  queryBuilder = applyOrderListFilters(queryBuilder, filters);

  if (cursor) {
    const decoded = decodeOrderCursor(cursor);
    if (decoded) {
      queryBuilder.andWhere(
        "(order.createdAt, order.id) < (:cursorCreatedAt, :cursorId)",
        {
          cursorCreatedAt: decoded.createdAt,
          cursorId: decoded.id,
        },
      );
    }
  }

  const rows = await queryBuilder.getMany();
  const hasNextPage = rows.length > limit;
  const orders = hasNextPage ? rows.slice(0, limit) : rows;
  const last = orders.at(-1);

  return {
    orders,
    hasNextPage,
    nextCursor:
      hasNextPage && last
        ? encodeOrderCursor(last.createdAt, last.id)
        : null,
  };
}
