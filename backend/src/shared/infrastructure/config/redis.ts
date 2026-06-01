/**
 * @file Fábrica e pool de conexões Redis (app, subscriber, worker).
 * @module shared/infrastructure/config/redis
 */

import Redis, { type RedisOptions } from "ioredis";
import { env } from "./env";

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;
let redisWorker: Redis | null = null;

const sharedOptions = {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
} as const;

/** Monta URL ou opções de host/porta a partir de `env.redis`. */
function buildRedisOptions(): string | RedisOptions {
  const url = (process.env.REDIS_URL ?? env.redis.url).trim();
  if (url) {
    return url;
  }

  const db = Number(process.env.REDIS_DB ?? String(env.redis.db));

  return {
    host: env.redis.host,
    port: env.redis.port,
    db,
    ...sharedOptions,
  };
}

/**
 * Cria uma nova conexão Redis (não reutiliza o singleton da aplicação).
 * @returns Cliente ioredis configurado.
 */
export function createRedisConnection(): Redis {
  const options = buildRedisOptions();

  if (typeof options === "string") {
    return new Redis(options, sharedOptions);
  }

  return new Redis(options);
}

/**
 * Retorna o cliente Redis principal da aplicação (singleton).
 * @returns Instância compartilhada de Redis.
 */
export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = createRedisConnection();
  }
  return redisClient;
}

/**
 * Retorna cliente Redis dedicado a assinaturas pub/sub (singleton).
 * @returns Instância de subscriber Redis.
 */
export function getRedisSubscriber(): Redis {
  if (!redisSubscriber) {
    redisSubscriber = createRedisConnection();
  }
  return redisSubscriber;
}

/**
 * Retorna cliente Redis dedicado ao worker de background (singleton).
 * @returns Instância de worker Redis.
 */
export function getRedisWorker(): Redis {
  if (!redisWorker) {
    redisWorker = createRedisConnection();
  }
  return redisWorker;
}

/**
 * Padrão PSUBSCRIBE para eventos `expired` no database Redis configurado.
 * @returns Ex.: `__keyevent@1__:expired` quando `REDIS_DB=1`.
 */
export function getRedisKeyspaceExpiredPattern(): string {
  const db = Number(process.env.REDIS_DB ?? String(env.redis.db));
  return `__keyevent@${db}__:expired`;
}

/**
 * Habilita notificações de expiração de chaves (`Ex`) no Redis.
 * @param redis - Cliente onde aplicar a configuração.
 * @returns Promise resolvida após `CONFIG SET`.
 */
export async function enableKeyspaceNotifications(redis: Redis): Promise<void> {
  await redis.config("SET", "notify-keyspace-events", "Ex");
}

/**
 * Encerra todas as conexões Redis singleton e zera as referências.
 * @returns Promise resolvida após `quit` em todos os clientes abertos.
 */
export async function closeRedisConnections(): Promise<void> {
  const clients = [redisClient, redisSubscriber, redisWorker].filter(
    (client): client is Redis => client !== null,
  );

  await Promise.all(clients.map((client) => client.quit()));

  redisClient = null;
  redisSubscriber = null;
  redisWorker = null;
}
