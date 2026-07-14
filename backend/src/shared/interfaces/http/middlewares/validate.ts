/**
 * @file Middleware de validação de request com Zod.
 * @module shared/interfaces/http/middlewares/validate
 */

import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import "../../../kernel/configureZodLocale";

/**
 * Express 5 expõe `query` e `params` como getters; substituímos via `defineProperty`.
 */
function replaceReadonlyRequestField<K extends "query" | "params">(
  req: Request,
  key: K,
  value: Request[K],
): void {
  Object.defineProperty(req, key, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

/**
 * Valida `req.body` e substitui pelo resultado parseado.
 * @param schema - Schema Zod do corpo.
 */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const issue = result.error.issues[0];
      res.status(400).json({
        error: issue?.message ?? "Dados da requisição inválidos",
        code: "VALIDATION_ERROR",
        field: issue?.path.join(".") || undefined,
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

/**
 * Valida `req.query` e substitui pelo resultado parseado.
 * @param schema - Schema Zod da query string.
 */
export function validateQuery<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const issue = result.error.issues[0];
      res.status(400).json({
        error: issue?.message ?? "Parâmetros de consulta inválidos",
        code: "VALIDATION_ERROR",
        field: issue?.path.join(".") || undefined,
      });
      return;
    }

    replaceReadonlyRequestField(req, "query", result.data as Request["query"]);
    next();
  };
}

/**
 * Valida `req.params` e substitui pelo resultado parseado.
 * @param schema - Schema Zod dos parâmetros de rota.
 */
export function validateParams<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const issue = result.error.issues[0];
      res.status(400).json({
        error: issue?.message ?? "Parâmetros da rota inválidos",
        code: "VALIDATION_ERROR",
        field: issue?.path.join(".") || undefined,
      });
      return;
    }

    replaceReadonlyRequestField(req, "params", result.data as Request["params"]);
    next();
  };
}
