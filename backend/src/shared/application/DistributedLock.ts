/**
 * @file Bloqueio distribuído via Redis para operações críticas concorrentes.
 * @module shared/application/DistributedLock
 */

import { randomUUID } from "node:crypto";
import type Redis from "ioredis";

const RELEASE_LOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
`;

/** Identificador de um lock adquirido (chave + token de propriedade). */
export interface LockHandle {
  /** Chave Redis do lock. */
  key: string;
  /** Token único do detentor do lock. */
  token: string;
}

/**
 * Aguarda um intervalo em milissegundos.
 * @param ms - Duração em milissegundos.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Tenta adquirir um lock distribuído com TTL e retentativas com backoff.
 * @param redis - Cliente Redis.
 * @param key - Chave do lock.
 * @param ttlMs - Tempo de vida do lock em milissegundos.
 * @param maxAttempts - Número máximo de tentativas de aquisição.
 * @returns Handle do lock ou `null` se não conseguir adquirir.
 */
export async function acquireLock(
  redis: Redis,
  key: string,
  ttlMs: number,
  maxAttempts = 8,
): Promise<LockHandle | null> {
  const token = randomUUID();

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const acquired = await redis.set(key, token, "PX", ttlMs, "NX");

    if (acquired === "OK") {
      return { key, token };
    }

    if (attempt < maxAttempts) {
      await sleep(50 * attempt);
    }
  }

  return null;
}

/**
 * Libera um lock somente se o token ainda pertence ao chamador (script atômico).
 * @param redis - Cliente Redis.
 * @param handle - Handle retornado por `acquireLock`.
 * @returns Promise resolvida após a tentativa de liberação.
 */
export async function releaseLock(
  redis: Redis,
  handle: LockHandle,
): Promise<void> {
  await redis.eval(RELEASE_LOCK_SCRIPT, 1, handle.key, handle.token);
}

/**
 * Executa `fn` sob um lock distribuído, liberando-o ao final (sucesso ou erro).
 * @param redis - Cliente Redis.
 * @param key - Chave do lock.
 * @param ttlMs - Tempo de vida do lock em milissegundos.
 * @param fn - Operação crítica a serializar.
 * @param maxAttempts - Tentativas de aquisição do lock.
 * @returns Resultado de `fn`.
 * @throws {LockNotAcquiredError} Se o lock não puder ser adquirido.
 */
export async function withLock<T>(
  redis: Redis,
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
  maxAttempts = 8,
): Promise<T> {
  const handle = await acquireLock(redis, key, ttlMs, maxAttempts);

  if (!handle) {
    throw new LockNotAcquiredError(key);
  }

  try {
    return await fn();
  } finally {
    await releaseLock(redis, handle);
  }
}

/** Falha ao adquirir lock distribuído após todas as tentativas. */
export class LockNotAcquiredError extends Error {
  constructor(public readonly lockKey: string) {
    super(`Failed to acquire distributed lock: ${lockKey}`);
    this.name = "LockNotAcquiredError";
  }
}
