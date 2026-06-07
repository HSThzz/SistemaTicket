/**
 * @file Filtros de listagem de ingressos do usuário.
 * @module modules/ticketing/application/helpers/applyTicketListFilters
 */

import type { SelectQueryBuilder } from "typeorm";
import type { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import type { TicketStatus } from "../../../../shared/kernel/enums";
import {
  applyFilters,
  type QueryFilterMap,
} from "../../../../shared/infrastructure/persistence/helpers/applyFilters";

export interface TicketListFilters {
  status?: TicketStatus;
}

const ticketListFilterMap: QueryFilterMap<Ticket> = {
  status: (queryBuilder, value) =>
    queryBuilder.andWhere("ticket.status = :status", { status: value }),
};

/**
 * Aplica filtros opcionais à query de listagem de ingressos.
 */
export function applyTicketListFilters(
  queryBuilder: SelectQueryBuilder<Ticket>,
  filters?: TicketListFilters,
): SelectQueryBuilder<Ticket> {
  return applyFilters(queryBuilder, filters, ticketListFilterMap);
}
