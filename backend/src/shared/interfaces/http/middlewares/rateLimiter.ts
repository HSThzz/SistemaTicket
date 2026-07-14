/**
 * @file Limitadores de taxa HTTP com armazenamento Redis.
 * @module shared/interfaces/http/middlewares/rateLimiter
 */

import type { Request, Response } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
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
      error: "Muitas requisições. Tente novamente em instantes.",
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

/** Limitador para POST /auth/register: 10 requisições por minuto por IP. */
export const authRegisterRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("auth-register"),
  skip: skipInTest,
  handler: buildRateLimitHandler("auth-register"),
});

/** Limitador para PATCH /auth/me/password: 5 tentativas por minuto por usuário. */
export const authPasswordChangeRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("auth-password-change"),
  skip: skipInTest,
  keyGenerator: (req) => {
    if (req.user?.id) {
      return req.user.id;
    }

    const ip = req.ip;
    return ip ? ipKeyGenerator(ip) : "unknown";
  },
  handler: buildRateLimitHandler("auth-password-change"),
});

/** Limitador para POST /auth/forgot-password: 5 requisições por minuto por IP. */
export const authForgotPasswordRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("auth-forgot-password"),
  skip: skipInTest,
  handler: buildRateLimitHandler("auth-forgot-password"),
});

/** Limitador para POST /auth/reset-password: 10 requisições por minuto por IP. */
export const authResetPasswordRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("auth-reset-password"),
  skip: skipInTest,
  handler: buildRateLimitHandler("auth-reset-password"),
});

/** Limitador para PATCH /auth/users/:userId/password: 5 redefinições por minuto por admin. */
export const authAdminPasswordResetRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("auth-admin-password-reset"),
  skip: skipInTest,
  keyGenerator: (req) => {
    if (req.user?.id) {
      return req.user.id;
    }

    const ip = req.ip;
    return ip ? ipKeyGenerator(ip) : "unknown";
  },
  handler: buildRateLimitHandler("auth-admin-password-reset"),
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

/** Limitador para POST /tickets/check-in: 60 requisições por minuto por usuário. */
export const checkInRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("check-in"),
  skip: skipInTest,
  keyGenerator: (req) => {
    if (req.user?.id) {
      return req.user.id;
    }

    const ip = req.ip;
    return ip ? ipKeyGenerator(ip) : "unknown";
  },
  handler: buildRateLimitHandler("check-in"),
});

/** Limitador para POST /leads/producer-contact: 10 requisições por minuto por IP. */
export const contactFormRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("contact-form"),
  skip: skipInTest,
  handler: buildRateLimitHandler("contact-form"),
});

/**
 * Limitador por e-mail no formulário de produtores: 3 envios por hora.
 * Deve rodar depois de `validateBody` (usa `req.body.email` já normalizado).
 */
export const contactFormEmailRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("contact-form-email"),
  skip: skipInTest,
  keyGenerator: (req) => {
    const email =
      typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (email) {
      return email;
    }

    const ip = req.ip;
    return ip ? ipKeyGenerator(ip) : "unknown";
  },
  handler: buildRateLimitHandler("contact-form-email"),
});

/** Limitador para POST participação: 10 requisições por minuto por usuário. */
export const participationSubmitRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("participation-submit"),
  skip: skipInTest,
  keyGenerator: (req) => {
    if (req.user?.id) {
      return req.user.id;
    }

    const ip = req.ip;
    return ip ? ipKeyGenerator(ip) : "unknown";
  },
  handler: buildRateLimitHandler("participation-submit"),
});
