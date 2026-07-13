import type Redis from "ioredis";
import { TICKET_LOT_STOCK_KEY_PREFIX } from "../../../../shared/infrastructure/config/constants";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { findAllTicketLotsStock } from "../queries/findAllTicketLotsStock";
import { sumPendingQuantitiesByLot } from "../helpers/sumPendingReservationQuantities";
import type { StockReconciliationReport } from "./types";

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
