/**
 * @file Detecta violações de unicidade do PostgreSQL (código 23505).
 * @module shared/infrastructure/persistence/isUniqueViolation
 */

import { QueryFailedError } from "typeorm";

type PgDriverError = {
  code?: string;
  constraint?: string;
  detail?: string;
};

function getDriverError(error: unknown): PgDriverError | undefined {
  if (!(error instanceof QueryFailedError)) {
    return undefined;
  }

  return error.driverError as PgDriverError;
}

/** Indica se o erro é uma violação de constraint UNIQUE no PostgreSQL. */
export function isUniqueViolation(error: unknown): boolean {
  return getDriverError(error)?.code === "23505";
}

/**
 * Indica se a violação de unicidade envolve a coluna/constraint informada
 * (busca no nome da constraint e no detalhe do Postgres).
 */
export function isUniqueViolationOn(error: unknown, columnOrConstraint: string): boolean {
  const driver = getDriverError(error);

  if (!driver || driver.code !== "23505") {
    return false;
  }

  const needle = columnOrConstraint.toLowerCase();
  const haystack = `${driver.constraint ?? ""} ${driver.detail ?? ""}`.toLowerCase();

  return haystack.includes(needle);
}
