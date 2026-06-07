/**
 * @file Filtros de listagem de pedidos do usuário.
 * @module modules/sales/application/helpers/applyOrderListFilters
 */

import type { SelectQueryBuilder } from "typeorm";
import type { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import type { OrderStatus } from "../../../../shared/kernel/enums";
import {
  applyFilters,
  type QueryFilterMap,
} from "../../../../shared/infrastructure/persistence/helpers/applyFilters";

export interface OrderListFilters {
  status?: OrderStatus;
}

const orderListFilterMap: QueryFilterMap<Order> = {
  status: (queryBuilder, value) =>
    queryBuilder.andWhere("order.status = :status", { status: value }),
};

/**
 * Aplica filtros opcionais à query de listagem de pedidos.
 */
export function applyOrderListFilters(
  queryBuilder: SelectQueryBuilder<Order>,
  filters?: OrderListFilters,
): SelectQueryBuilder<Order> {
  return applyFilters(queryBuilder, filters, orderListFilterMap);
}
