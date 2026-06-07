/**
 * @file Middleware global de tratamento de erros HTTP.
 * @module shared/interfaces/http/middlewares/errorHandler
 */

import type { NextFunction, Request, Response } from "express";
import { ValidationError } from "../../../kernel/validateSchema";
import { Logger } from "../../../infrastructure/config/logger";

const CONTEXT = "ErrorHandler";
const logger = Logger.getInstance();

interface CodedError extends Error {
  code: string;
}

function isCodedError(error: unknown): error is CodedError {
  return (
    error instanceof Error &&
    typeof (error as CodedError).code === "string" &&
    (error as CodedError).code.length > 0
  );
}

/**
 * Mapeia códigos de erro de domínio para status HTTP.
 * @param code - Código estável exposto pela API.
 * @returns Status HTTP sugerido.
 */
function resolveStatusCode(code: string): number {
  switch (code) {
    case "INVALID_CREDENTIALS":
    case "UNAUTHORIZED":
    case "WEBHOOK_UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
    case "EVENT_ACCESS_DENIED":
    case "RESERVATION_ACCESS_DENIED":
    case "CHECKIN_ACCESS_DENIED":
      return 403;
    case "EVENT_NOT_FOUND":
    case "ORDER_NOT_FOUND":
    case "TICKET_LOT_NOT_FOUND":
    case "RESERVATION_NOT_FOUND":
    case "USER_NOT_FOUND":
    case "TICKET_NOT_FOUND":
      return 404;
    case "EMAIL_ALREADY_EXISTS":
    case "WEBHOOK_REPLAY":
    case "PAYMENT_ALREADY_PROCESSED":
    case "ORDER_ALREADY_REFUNDED":
      return 409;
    case "INSUFFICIENT_STOCK":
    case "LOCK_NOT_ACQUIRED":
      return 409;
    case "INVALID_WEBHOOK_PAYLOAD":
    case "INVALID_ROLE":
    case "INVALID_QUANTITY":
    case "INVALID_TICKET_STATUS":
    case "EVENT_NOT_PUBLISHED":
    case "CHECKIN_NOT_ALLOWED_TODAY":
    case "ORDER_NOT_REFUNDABLE":
      return 400;
    case "PAYMENT_GATEWAY_ERROR":
    case "WALLET_CONFIG_ERROR":
      return 502;
    default:
      return 400;
  }
}

/**
 * Middleware Express que captura erros não tratados nos controllers.
 * Erros com propriedade `code` (erros de domínio) recebem status mapeado.
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ValidationError) {
    res.status(400).json({
      error: error.message,
      code: error.code,
      field: error.issues[0]?.path || undefined,
    });
    return;
  }

  if (isCodedError(error)) {
    const status = resolveStatusCode(error.code);
    if (status >= 500) {
      logger.error(CONTEXT, "Domain error mapped to 5xx", {
        code: error.code,
        error: error.message,
      });
    }

    res.status(status).json({
      error: error.message,
      code: error.code,
    });
    return;
  }

  logger.error(CONTEXT, "Unhandled error", {
    error: error instanceof Error ? error.message : String(error),
  });

  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}

/**
 * Wrapper para handlers async: encaminha rejeições ao middleware de erro.
 * @param handler - Função async `(req, res, next)`.
 * @returns Handler Express compatível.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}
