/**
 * @file Aplica filtros opcionais a um QueryBuilder TypeORM.
 * @module shared/infrastructure/persistence/helpers/applyFilters
 */

import type { ObjectLiteral, SelectQueryBuilder } from "typeorm";

export type QueryFilterApplier<T extends ObjectLiteral> = (
  queryBuilder: SelectQueryBuilder<T>,
  value: unknown,
) => SelectQueryBuilder<T>;

export type QueryFilterMap<T extends ObjectLiteral> = Record<
  string,
  QueryFilterApplier<T>
>;

function isEmptyFilterValue(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

/**
 * Aplica filtros definidos em `filterMap` quando presentes em `filters`.
 *
 * @param queryBuilder - QueryBuilder base já com joins e condições fixas.
 * @param filters - Mapa de filtros opcionais (ex.: `{ status: "ACTIVE" }`).
 * @param filterMap - Definição de como cada chave de filtro altera a query.
 */
export function applyFilters<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  filters: object | undefined,
  filterMap: QueryFilterMap<T>,
): SelectQueryBuilder<T> {
  if (!filters) {
    return queryBuilder;
  }

  for (const [key, value] of Object.entries(filters)) {
    if (isEmptyFilterValue(value)) {
      continue;
    }

    const apply = filterMap[key];
    if (apply) {
      apply(queryBuilder, value);
    }
  }

  return queryBuilder;
}
