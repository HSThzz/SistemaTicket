/**
 * @file Libera hold de estoque Redis de uma reserva (meta atômica + stock).
 * @module modules/sales/application/helpers/releaseRedisReservationHold
 */

import type Redis from "ioredis";
import {
  RESERVATION_KEY_PREFIX,
  RESERVATION_META_KEY_PREFIX,
  TICKET_LOT_STOCK_KEY_PREFIX,
} from "../../../../shared/infrastructure/config/constants";

export type ReservationMetaPayload = {
  reservationId: string;
  userId: string;
  ticketLotId: string;
  quantity: number;
};

const CLAIM_META_LUA = `
  local value = redis.call("GET", KEYS[1])
  if not value then
    return false
  end
  redis.call("DEL", KEYS[1])
  return value
`;

/**
 * Claim atômico da meta da reserva (GET + DEL).
 * Só um consumidor (expiry ou compensate) consegue o valor.
 */
export async function claimReservationMeta(
  redis: Redis,
  reservationId: string,
): Promise<ReservationMetaPayload | null> {
  const metaKey = `${RESERVATION_META_KEY_PREFIX}${reservationId}`;
  const raw = (await redis.eval(CLAIM_META_LUA, 1, metaKey)) as
    | string
    | null
    | false;

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ReservationMetaPayload;
  } catch {
    return null;
  }
}

/** Remove a meta sem devolver estoque (hold já refletido no Postgres). */
export async function clearReservationMeta(
  redis: Redis,
  reservationId: string,
): Promise<void> {
  await redis.del(`${RESERVATION_META_KEY_PREFIX}${reservationId}`);
}

/**
 * Devolve estoque Redis de forma idempotente entre expiry e compensate.
 * Prefere a meta; reservas legadas (sem meta) só liberam se a key ainda existir.
 */
export async function releaseRedisReservationHold(
  redis: Redis,
  reservationId: string,
  fallback?: { ticketLotId: string; quantity: number },
): Promise<boolean> {
  const reservationKey = `${RESERVATION_KEY_PREFIX}${reservationId}`;
  const meta = await claimReservationMeta(redis, reservationId);

  if (meta) {
    await redis.del(reservationKey);
    await redis.incrby(
      `${TICKET_LOT_STOCK_KEY_PREFIX}${meta.ticketLotId}`,
      meta.quantity,
    );
    return true;
  }

  if (!fallback) {
    await redis.del(reservationKey);
    return false;
  }

  const removed = await redis.del(reservationKey);
  if (removed !== 1) {
    return false;
  }

  await redis.incrby(
    `${TICKET_LOT_STOCK_KEY_PREFIX}${fallback.ticketLotId}`,
    fallback.quantity,
  );
  return true;
}
