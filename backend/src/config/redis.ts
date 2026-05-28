import Redis, { type RedisOptions } from "ioredis";
import { env } from "./env";

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;
let redisWorker: Redis | null = null;

const sharedOptions = {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
} as const;

function buildRedisOptions(): string | RedisOptions {
  const url = env.redis.url.trim();
  if (url) {
    return url;
  }

  return {
    host: env.redis.host,
    port: env.redis.port,
    db: env.redis.db,
    ...sharedOptions,
  };
}

export function createRedisConnection(): Redis {
  const options = buildRedisOptions();

  if (typeof options === "string") {
    return new Redis(options, sharedOptions);
  }

  return new Redis(options);
}

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = createRedisConnection();
  }
  return redisClient;
}

export function getRedisSubscriber(): Redis {
  if (!redisSubscriber) {
    redisSubscriber = createRedisConnection();
  }
  return redisSubscriber;
}

export function getRedisWorker(): Redis {
  if (!redisWorker) {
    redisWorker = createRedisConnection();
  }
  return redisWorker;
}

export async function enableKeyspaceNotifications(redis: Redis): Promise<void> {
  await redis.config("SET", "notify-keyspace-events", "Ex");
}

export async function closeRedisConnections(): Promise<void> {
  const clients = [redisClient, redisSubscriber, redisWorker].filter(
    (client): client is Redis => client !== null,
  );

  await Promise.all(clients.map((client) => client.quit()));

  redisClient = null;
  redisSubscriber = null;
  redisWorker = null;
}
