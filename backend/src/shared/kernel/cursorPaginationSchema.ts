/**
 * @file Schema Zod para parâmetros de paginação por cursor.
 * @module shared/kernel/cursorPaginationSchema
 */

import { z } from "zod";
import { uuidSchema } from "./zodFields";
import {
  DEFAULT_CURSOR_PAGE_LIMIT,
  MAX_CURSOR_PAGE_LIMIT,
} from "./cursorPagination";

function emptyToUndefined(value: unknown): unknown {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return value;
}

/** Query string com `limit` (1–100, padrão 10) e `cursor` UUID opcional. */
export const cursorPaginationQuerySchema = z.object({
  limit: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number()
      .int("Limit deve ser um número inteiro")
      .min(1, "Limit deve ser no mínimo 1")
      .max(MAX_CURSOR_PAGE_LIMIT, `Limit máximo é ${MAX_CURSOR_PAGE_LIMIT}`)
      .default(DEFAULT_CURSOR_PAGE_LIMIT),
  ),
  cursor: z.preprocess(emptyToUndefined, uuidSchema.optional()),
});

export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>;
