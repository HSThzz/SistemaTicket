/**
 * @file Validação compartilhada com Zod para services e use cases.
 * @module shared/kernel/validateSchema
 */

import type { ZodType } from "zod";

export interface ValidationIssue {
  path: string;
  message: string;
}

/** Erro lançado quando os dados não passam no schema Zod. */
export class ValidationError extends Error {
  readonly code = "VALIDATION_ERROR";

  constructor(
    message: string,
    public readonly issues: ValidationIssue[],
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Valida `data` contra um schema Zod e retorna o valor tipado.
 * @param schema - Schema Zod do domínio.
 * @param data - Payload bruto recebido pela service.
 * @throws {ValidationError} Quando a validação falha.
 */
export function validateSchema<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    throw new ValidationError(
      issues[0]?.message ?? "Validation failed",
      issues,
    );
  }

  return result.data;
}
