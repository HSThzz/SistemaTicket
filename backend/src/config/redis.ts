import Redis from "ioredis";
import { env } from "./env";

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;
let redisWorker: Redis | null = null;

function buildRedisOptions() {
  return {
    host: env.redis.host,
    port: env.redis.port,
    db: env.redis.db,
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  } as const;
}

export function createRedisConnection(): Redis {
  return new Redis(buildRedisOptions());
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
