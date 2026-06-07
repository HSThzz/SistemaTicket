/**
 * @file Aplica paginação por cursor a um QueryBuilder TypeORM.
 * @module shared/infrastructure/persistence/helpers/applyPagination
 */

import type { ObjectLiteral, SelectQueryBuilder } from "typeorm";
import {
  buildCursorPageResult,
  type CursorPageResult,
} from "../../../kernel/cursorPagination";

export interface CursorPaginationInput {
  limit: number;
  cursor?: string;
}

export interface ApplyPaginationOptions {
  /** Alias da entidade raiz no QueryBuilder. */
  alias: string;
  /** Direção de ordenação do cursor (padrão: DESC). */
  order?: "ASC" | "DESC";
  /** Coluna usada como cursor (padrão: id). */
  cursorColumn?: string;
}

/**
 * Configura ordenação, limite (`limit + 1`) e condição de cursor na query.
 */
export function applyPagination<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  pagination: CursorPaginationInput,
  options: ApplyPaginationOptions,
): SelectQueryBuilder<T> {
  const { limit, cursor } = pagination;
  const { alias, order = "DESC", cursorColumn = "id" } = options;
  const column = `${alias}.${cursorColumn}`;
  const operator = order === "DESC" ? "<" : ">";

  queryBuilder.orderBy(column, order).take(limit + 1);

  if (cursor) {
    queryBuilder.andWhere(`${column} ${operator} :cursor`, { cursor });
  }

  return queryBuilder;
}

/**
 * Executa a query paginada e monta o resultado com `nextCursor` e `hasNextPage`.
 */
export async function fetchCursorPage<T extends { id: string }>(
  queryBuilder: SelectQueryBuilder<T>,
  limit: number,
): Promise<CursorPageResult<T>> {
  const rows = await queryBuilder.getMany();
  return buildCursorPageResult(rows, limit);
}
