/**
 * @file Query: lista ingressos de um usuário com paginação por cursor.
 * @module modules/ticketing/application/queries/findManyTicketsByUserId
 */

import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import {
  applyPagination,
  fetchCursorPage,
} from "../../../../shared/infrastructure/persistence/helpers/applyPagination";
import {
  applyTicketListFilters,
  type TicketListFilters,
} from "../helpers/applyTicketListFilters";

export interface FindManyTicketsByUserIdParams {
  userId: string;
  limit: number;
  cursor?: string;
  filters?: TicketListFilters;
}

export interface FindManyTicketsByUserIdResult {
  tickets: Ticket[];
  hasNextPage: boolean;
  nextCursor: string | null;
}

export async function findManyTicketsByUserId(
  params: FindManyTicketsByUserIdParams,
): Promise<FindManyTicketsByUserIdResult> {
  const { userId, limit, cursor, filters } = params;

  let queryBuilder = AppDataSource.getRepository(Ticket)
    .createQueryBuilder("ticket")
    .innerJoinAndSelect("ticket.order", "order")
    .innerJoinAndSelect("ticket.ticketLot", "ticketLot")
    .innerJoinAndSelect("ticketLot.event", "event")
    .where("order.userId = :userId", { userId });

  queryBuilder = applyTicketListFilters(queryBuilder, filters);
  queryBuilder = applyPagination(queryBuilder, { limit, cursor }, { alias: "ticket" });

  const page = await fetchCursorPage(queryBuilder, limit);

  return {
    tickets: page.items,
    hasNextPage: page.hasNextPage,
    nextCursor: page.nextCursor,
  };
}
