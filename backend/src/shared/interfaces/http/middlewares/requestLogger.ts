/**
 * @file Middleware de log de requisições HTTP concluídas.
 * @module shared/interfaces/http/middlewares/requestLogger
 */

import type { NextFunction, Request, Response } from "express";
import { Logger } from "../../../infrastructure/config/logger";

const logger = Logger.getInstance();
const CONTEXT = "HTTP";

/**
 * Registra método, URL, status e duração ao finalizar a resposta.
 * @param req - Requisição Express.
 * @param res - Resposta Express.
 * @param next - Próximo middleware.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;

    logger.info(CONTEXT, "Request completed", {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
    });
  });

  next();
}
