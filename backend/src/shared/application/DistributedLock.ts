import { randomUUID } from "node:crypto";
import type Redis from "ioredis";

const RELEASE_LOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
`;

export interface LockHandle {
  key: string;
  token: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

export async function releaseLock(
  redis: Redis,
  handle: LockHandle,
): Promise<void> {
  await redis.eval(RELEASE_LOCK_SCRIPT, 1, handle.key, handle.token);
}
