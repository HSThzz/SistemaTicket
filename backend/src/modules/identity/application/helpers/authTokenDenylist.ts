/**
 * @file Denylist de JWT (jti) no Redis para logout server-side.
 * @module modules/identity/application/helpers/authTokenDenylist
 */

import { getRedis } from "../../../../shared/infrastructure/config/redis";

const KEY_PREFIX = "auth:deny:";

/**
 * Marca o `jti` como revogado até o fim da vida útil do token.
 * @param jti - Identificador único do JWT.
 * @param ttlSeconds - TTL restante do token (mínimo 1s).
 */
export async function revokeAuthToken(
  jti: string,
  ttlSeconds: number,
): Promise<void> {
  const ttl = Math.max(1, Math.floor(ttlSeconds));
  await getRedis().set(`${KEY_PREFIX}${jti}`, "1", "EX", ttl);
}

/** Indica se o `jti` está na denylist. */
export async function isAuthTokenDenylisted(jti: string): Promise<boolean> {
  const value = await getRedis().get(`${KEY_PREFIX}${jti}`);
  return value !== null;
}
