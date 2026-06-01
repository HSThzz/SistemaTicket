/**
 * @file Limitadores de taxa HTTP com armazenamento Redis.
 * @module shared/interfaces/http/middlewares/rateLimiter
 */

import type { Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { Logger } from "../../../infrastructure/config/logger";
import { getRedis } from "../../../infrastructure/config/redis";

const CONTEXT = "RateLimiter";
const logger = Logger.getInstance();

const WINDOW_MS = 60_000;

/**
 * Cria store Redis para um prefixo de rate limit.
 * @param prefix - Prefixo das chaves no Redis.
 * @returns Instância de `RedisStore` configurada.
 */
function createRedisStore(prefix: string): RedisStore {
  const redis = getRedis();

  return new RedisStore({
    prefix: `rl:${prefix}:`,
    sendCommand: (...args: string[]) =>
      redis.call(...(args as [string, ...string[]])) as Promise<number>,
  });
}

/**
 * Monta handler que responde 429 e registra bloqueio no log.
 * @param label - Identificador do limitador (global, auth-login, etc.).
 * @returns Handler do express-rate-limit.
 */
function buildRateLimitHandler(label: string) {
  return (req: Request, res: Response): void => {
    logger.warn(CONTEXT, "IP blocked by rate limit", {
      label,
      ip: req.ip,
      method: req.method,
      path: req.originalUrl,
    });

    res.status(429).json({
      error: "Too many requests. Please try again later.",
      code: "RATE_LIMIT_EXCEEDED",
      limit: label,
    });
  };
}

/** Indica se o rate limit deve ser ignorado em ambiente de teste. */
function skipInTest(): boolean {
  return process.env.NODE_ENV === "test";
}

/**
 * Define rotas isentas do limitador global (health, webhooks de pagamento).
 * @param req - Requisição Express.
 * @returns `true` para pular o rate limit.
 */
function shouldSkipGlobalLimit(req: Request): boolean {
  if (skipInTest()) {
    return true;
  }

  const path = req.path;

  if (path === "/health") {
    return true;
  }

  // Webhooks de gateway costumam vir em rajadas legítimas.
  if (path.startsWith("/payments/webhook")) {
    return true;
  }

  return false;
}

/** Limitador global: 100 requisições por minuto por IP. */
export const globalRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("global"),
  skip: shouldSkipGlobalLimit,
  handler: buildRateLimitHandler("global"),
});

/** Limitador para POST /auth/login: 15 requisições por minuto. */
export const authLoginRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("auth-login"),
  skip: skipInTest,
  handler: buildRateLimitHandler("auth-login"),
});

/** Limitador para POST /purchases/reserve: 15 requisições por minuto. */
export const reserveRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("reserve"),
  skip: skipInTest,
  handler: buildRateLimitHandler("reserve"),
});
