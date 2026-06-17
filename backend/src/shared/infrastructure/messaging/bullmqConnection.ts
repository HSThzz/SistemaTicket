/**
 * @file Opções de conexão Redis para filas BullMQ.
 * @module shared/infrastructure/messaging/bullmqConnection
 */

import type { ConnectionOptions } from "bullmq";
import { env } from "../config/env";

/**
 * Monta conexão Redis compatível com BullMQ (workers exigem `maxRetriesPerRequest: null`).
 * @returns Opções de conexão reutilizáveis por Queue e Worker.
 */
export function getBullMQConnection(): ConnectionOptions {
  const url = (process.env.REDIS_URL ?? env.redis.url).trim();

  if (url) {
    return {
      url,
      maxRetriesPerRequest: null,
    };
  }

  const db = Number(process.env.REDIS_DB ?? String(env.redis.db));

  return {
    host: env.redis.host,
    port: env.redis.port,
    db,
    maxRetriesPerRequest: null,
  };
}
