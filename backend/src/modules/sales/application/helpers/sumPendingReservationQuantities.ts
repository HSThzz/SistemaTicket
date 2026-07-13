/**
 * @file Soma quantidades de jobs de persistência pendentes por lote (filas + schedule).
 * @module modules/sales/application/helpers/sumPendingReservationQuantities
 */

import type Redis from "ioredis";
import {
  RESERVATION_PERSIST_DLQ_KEY,
  RESERVATION_PERSIST_QUEUE_KEY,
  RESERVATION_PERSIST_RETRY_QUEUE_KEY,
  RESERVATION_PERSIST_RETRY_SCHEDULE_KEY,
} from "../../../../shared/infrastructure/config/constants";
import type { PersistJobPayload } from "../services/types";

/** Soma quantidades pendentes em todas as filas de persistência, indexadas por ticketLotId. */
export async function sumPendingQuantitiesByLot(
  redis: Redis,
): Promise<Map<string, number>> {
  const pending = new Map<string, number>();
  const queueKeys = [
    RESERVATION_PERSIST_QUEUE_KEY,
    RESERVATION_PERSIST_RETRY_QUEUE_KEY,
    RESERVATION_PERSIST_DLQ_KEY,
  ];

  for (const key of queueKeys) {
    const items = await redis.lrange(key, 0, -1);
    addPayloadQuantities(pending, items);
  }

  const scheduled = await redis.zrange(
    RESERVATION_PERSIST_RETRY_SCHEDULE_KEY,
    0,
    -1,
  );
  addPayloadQuantities(pending, scheduled);

  return pending;
}

/** Quantidade pendente de um lote específico. */
export async function sumPendingQuantityForLot(
  redis: Redis,
  ticketLotId: string,
): Promise<number> {
  const pending = await sumPendingQuantitiesByLot(redis);
  return pending.get(ticketLotId) ?? 0;
}

function addPayloadQuantities(
  map: Map<string, number>,
  rawItems: string[],
): void {
  for (const raw of rawItems) {
    try {
      const payload = JSON.parse(raw) as PersistJobPayload;
      const lotId = payload.ticketLotId;
      const quantity = payload.quantity;

      if (
        !lotId ||
        quantity === undefined ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        continue;
      }

      map.set(lotId, (map.get(lotId) ?? 0) + quantity);
    } catch {
      // Ignora payloads inválidos na fila.
    }
  }
}
