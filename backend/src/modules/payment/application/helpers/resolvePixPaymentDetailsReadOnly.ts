import type Redis from "ioredis";
import { PAYMENT_CACHE_KEY_PREFIX } from "../../../../shared/infrastructure/config/constants";
import type { Order } from "../../../../shared/infrastructure/persistence/entities/Order";
import { OrderStatus } from "../../../../shared/kernel/enums";
import { buildPixPaymentDetails } from "./buildPixPaymentDetails";
import type { PixPaymentDetails } from "../types";

/**
 * Resolve detalhes PIX sem efeitos colaterais (sem UPDATE no Postgres nem HTTP ao gateway).
 * Usado em listagens e leituras administrativas.
 */
export function resolvePixPaymentDetailsReadOnly(
  order: Order,
  cached?: PixPaymentDetails | null,
): PixPaymentDetails | null {
  if (order.status !== OrderStatus.PENDING) {
    return null;
  }

  if (order.pixCopyPaste && order.pixExpiresAt) {
    return buildPixPaymentDetails(order, {
      transactionId: order.paymentGatewayId ?? "",
      pixCopyPaste: order.pixCopyPaste,
      expiresAt: order.pixExpiresAt,
    });
  }

  return cached ?? null;
}

/**
 * Carrega caches PIX de múltiplas reservas em uma única rodada Redis (`MGET`).
 */
export async function batchLoadPixPaymentsFromCache(
  redis: Redis,
  reservationIds: string[],
): Promise<Map<string, PixPaymentDetails>> {
  const result = new Map<string, PixPaymentDetails>();

  if (reservationIds.length === 0) {
    return result;
  }

  const keys = reservationIds.map(
    (reservationId) => `${PAYMENT_CACHE_KEY_PREFIX}${reservationId}`,
  );
  const values = await redis.mget(...keys);

  for (let index = 0; index < reservationIds.length; index += 1) {
    const raw = values[index];
    const reservationId = reservationIds[index];

    if (!raw || !reservationId) {
      continue;
    }

    try {
      result.set(reservationId, JSON.parse(raw) as PixPaymentDetails);
    } catch {
      // Ignora entradas corrompidas no cache.
    }
  }

  return result;
}
