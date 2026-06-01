/**
 * @file Middleware CORS com origens permitidas via configuração.
 * @module shared/interfaces/http/middlewares/corsMiddleware
 */

import type { NextFunction, Request, Response } from "express";
import { env } from "../../../infrastructure/config/env";

/**
 * Normaliza URL de origem removendo barras finais e espaços.
 * @param origin - Origem informada no header.
 * @returns Origem normalizada.
 */
function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, "");
}

const allowedOrigins = new Set(env.corsOrigins.map(normalizeOrigin));

/**
 * Aplica headers CORS, responde preflight OPTIONS e encaminha demais métodos.
 * @param req - Requisição Express.
 * @param res - Resposta Express.
 * @param next - Próximo middleware.
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin ? normalizeOrigin(req.headers.origin) : undefined;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-webhook-secret, x-webhook-timestamp, x-webhook-signature",
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
}
