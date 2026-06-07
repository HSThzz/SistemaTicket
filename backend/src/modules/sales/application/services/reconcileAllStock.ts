import type Redis from "ioredis";
import {
  RESERVATION_PERSIST_DLQ_KEY,
  RESERVATION_PERSIST_QUEUE_KEY,
  RESERVATION_PERSIST_RETRY_QUEUE_KEY,
  RESERVATION_PERSIST_RETRY_SCHEDULE_KEY,
  TICKET_LOT_STOCK_KEY_PREFIX,
} from "../../../../shared/infrastructure/config/constants";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { findAllTicketLotsStock } from "../queries/findAllTicketLotsStock";
import type { PersistJobPayload, StockReconciliationReport } from "./types";

const CONTEXT = "reconcileAllStock";

export async function reconcileAllStock(
  redis: Redis,
) {
  const logger = Logger.getInstance();
  const lots = await findAllTicketLotsStock();

  const pendingByLot = await sumPendingQuantitiesByLot(redis);
  const results: StockReconciliationReport["lots"] = [];

  for (const lot of lots) {
    const pendingInQueues = pendingByLot.get(lot.id) ?? 0;
    const expectedRedis = Math.max(
      0,
      Math.min(lot.totalQuantity, lot.availableQuantity - pendingInQueues),
    );
    const stockKey = `${TICKET_LOT_STOCK_KEY_PREFIX}${lot.id}`;
    const rawRedis = await redis.get(stockKey);
    const previousRedis = rawRedis === null ? null : Number(rawRedis);

    let corrected = false;

    if (previousRedis === null || previousRedis !== expectedRedis) {
      await redis.set(stockKey, String(expectedRedis));
      corrected = true;

      logger.warn(CONTEXT, "Redis stock corrected", {
        ticketLotId: lot.id,
        pgAvailable: lot.availableQuantity,
        pendingInQueues,
        expectedRedis,
        previousRedis,
      });
    }

    results.push({
      ticketLotId: lot.id,
      pgAvailable: lot.availableQuantity,
      pendingInQueues,
      expectedRedis,
      previousRedis,
      corrected,
    });
  }

  const correctedCount = results.filter((lot) => lot.corrected).length;

  logger.info(CONTEXT, "Stock reconciliation completed", {
    lotsChecked: results.length,
    correctedCount,
  });

  return {
    checkedAt: new Date().toISOString(),
    lotsChecked: results.length,
    correctedCount,
    lots: results,
  };
}

async function sumPendingQuantitiesByLot(redis: Redis) {
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

function addPayloadQuantities(map: Map<string, number>, rawItems: string[]): void {
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
