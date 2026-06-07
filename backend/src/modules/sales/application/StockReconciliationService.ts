/**
 * @file Alinha estoque Redis com `availableQuantity` do PostgreSQL, descontando filas pendentes.
 * @module sales/application/StockReconciliationService
 */

import type Redis from "ioredis";
import type { DataSource } from "typeorm";
import {
  RESERVATION_PERSIST_DLQ_KEY,
  RESERVATION_PERSIST_QUEUE_KEY,
  RESERVATION_PERSIST_RETRY_QUEUE_KEY,
  RESERVATION_PERSIST_RETRY_SCHEDULE_KEY,
  TICKET_LOT_STOCK_KEY_PREFIX,
} from "../../../shared/infrastructure/config/constants";
import { Logger } from "../../../shared/infrastructure/config/logger";
import { findAllTicketLotsStock } from "./queries/findAllTicketLotsStock";

const CONTEXT = "StockReconciliationService";

type PersistJobPayload = {
  ticketLotId?: string;
  quantity?: number;
};

/** Resultado da reconciliação de um lote. */
export interface LotReconciliationResult {
  ticketLotId: string;
  pgAvailable: number;
  pendingInQueues: number;
  expectedRedis: number;
  previousRedis: number | null;
  corrected: boolean;
}

/** Relatório agregado de uma execução de reconciliação. */
export interface StockReconciliationReport {
  checkedAt: string;
  lotsChecked: number;
  correctedCount: number;
  lots: LotReconciliationResult[];
}

/**
 * Calcula estoque esperado no Redis e corrige divergências em relação ao PostgreSQL.
 */
export class StockReconciliationService {
  private readonly logger = Logger.getInstance();

  /**
   * @param dataSource - Fonte TypeORM para leitura de lotes.
   * @param redis - Cliente Redis de estoque e filas.
   */
  constructor(
    private readonly dataSource: DataSource,
    private readonly redis: Redis,
  ) {}

  /**
   * Reconcilia todos os lotes: Redis deve refletir PG menos reservas ainda não persistidas.
   * @returns Relatório com lotes verificados e correções aplicadas.
   */
  async reconcileAll(): Promise<StockReconciliationReport> {
    const lots = await findAllTicketLotsStock(this.dataSource);

    const pendingByLot = await this.sumPendingQuantitiesByLot();
    const results: LotReconciliationResult[] = [];

    for (const lot of lots) {
      const pendingInQueues = pendingByLot.get(lot.id) ?? 0;
      const expectedRedis = Math.max(
        0,
        Math.min(lot.totalQuantity, lot.availableQuantity - pendingInQueues),
      );
      const stockKey = `${TICKET_LOT_STOCK_KEY_PREFIX}${lot.id}`;
      const rawRedis = await this.redis.get(stockKey);
      const previousRedis = rawRedis === null ? null : Number(rawRedis);

      let corrected = false;

      if (previousRedis === null || previousRedis !== expectedRedis) {
        await this.redis.set(stockKey, String(expectedRedis));
        corrected = true;

        this.logger.warn(CONTEXT, "Redis stock corrected", {
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

    const correctedCount = results.filter((r) => r.corrected).length;

    this.logger.info(CONTEXT, "Stock reconciliation completed", {
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

  /** Soma quantidades em filas de persistência ainda não refletidas no PostgreSQL. */
  private async sumPendingQuantitiesByLot(): Promise<Map<string, number>> {
    const pending = new Map<string, number>();

    const queueKeys = [
      RESERVATION_PERSIST_QUEUE_KEY,
      RESERVATION_PERSIST_RETRY_QUEUE_KEY,
      RESERVATION_PERSIST_DLQ_KEY,
    ];

    for (const key of queueKeys) {
      const items = await this.redis.lrange(key, 0, -1);
      this.addPayloadQuantities(pending, items);
    }

    const scheduled = await this.redis.zrange(
      RESERVATION_PERSIST_RETRY_SCHEDULE_KEY,
      0,
      -1,
    );
    this.addPayloadQuantities(pending, scheduled);

    return pending;
  }

  private addPayloadQuantities(map: Map<string, number>, rawItems: string[]): void {
    for (const raw of rawItems) {
      try {
        const payload = JSON.parse(raw) as PersistJobPayload;
        const lotId = payload.ticketLotId;
        const quantity = payload.quantity;

        if (!lotId || !Number.isInteger(quantity) || quantity! <= 0) {
          continue;
        }

        map.set(lotId, (map.get(lotId) ?? 0) + quantity!);
      } catch {
        // Ignora payloads inválidos na fila.
      }
    }
  }
}
