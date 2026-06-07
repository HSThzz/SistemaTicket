/**
 * @file Utilitários de paginação baseada em cursor.
 * @module shared/kernel/cursorPagination
 */

/** Limite padrão de registros por página. */
export const DEFAULT_CURSOR_PAGE_LIMIT = 10;

/** Limite máximo de registros por requisição. */
export const MAX_CURSOR_PAGE_LIMIT = 100;

export interface CursorPageResult<T> {
  items: T[];
  hasNextPage: boolean;
  nextCursor: string | null;
}

/**
 * Divide resultados buscados com `limit + 1` em página, cursor e indicador de próxima página.
 *
 * @param items - Registros retornados do banco (possivelmente um a mais que o limit).
 * @param limit - Tamanho máximo da página.
 */
export function buildCursorPageResult<T extends { id: string }>(
  items: T[],
  limit: number,
): CursorPageResult<T> {
  const hasNextPage = items.length > limit;
  const pageItems = hasNextPage ? items.slice(0, limit) : items;
  const lastItem = pageItems.at(-1);

  return {
    items: pageItems,
    hasNextPage,
    nextCursor: hasNextPage && lastItem ? lastItem.id : null,
  };
}
