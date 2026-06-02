/**
 * @file Controlador HTTP de reserva de ingressos, status e operações de fila (ops).
 * @module sales/interfaces/http/PurchaseController
 */

import type { Request, Response } from "express";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { getRedis } from "../../../../shared/infrastructure/config/redis";
import {
  RESERVATION_PERSIST_DLQ_KEY,
  RESERVATION_PERSIST_RETRY_QUEUE_KEY,
  RESERVATION_PERSIST_RETRY_SCHEDULE_KEY,
} from "../../../../shared/infrastructure/config/constants";
import {
  PurchaseError,
  ReservationAccessDeniedError,
  ReservationNotFoundError,
} from "../../domain/errors/PurchaseError";
import { getReservationPersistenceWorker } from "../../../../shared/runtime/workerRegistry";
import { QueueMonitorService } from "../../../../shared/application/QueueMonitorService";
import { ReservationStatusService } from "../../application/ReservationStatusService";
import { PurchaseService } from "../../application/PurchaseService";

const CONTEXT = "PurchaseController";
const logger = Logger.getInstance();
const purchaseService = new PurchaseService(AppDataSource, getRedis());
const reservationStatusService = new ReservationStatusService(
  AppDataSource,
  getRedis(),
);
const queueMonitorService = new QueueMonitorService(getRedis());

/**
 * Endpoints de compra assíncrona e monitoramento operacional da fila de persistência.
 */
export class PurchaseController {
  /**
   * Cria reserva de ingressos no Redis (`POST` body: `ticketLotId`, `quantity`).
   * @param req - Requisição autenticada.
   * @param res - Resposta HTTP (201 com reserva ou erro mapeado).
   */
  async reserve(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const { ticketLotId, quantity } = req.body as {
      ticketLotId: string;
      quantity: number;
    };

    try {
      const result = await purchaseService.reserveTickets(
        req.user.id,
        ticketLotId,
        Number(quantity),
      );

      res.status(201).json({
        reservation: {
          id: result.reservationId,
          status: "PENDING_PERSISTENCE",
          expiresAt: result.expiresAt,
          quantity: result.quantity,
          ticketLotId: result.ticketLotId,
        },
        stock: {
          remaining: result.remainingStock,
        },
        async: {
          persistedToPostgres: false,
          pollUrl: `/purchases/reservations/${result.reservationId}`,
        },
      });
    } catch (error) {
      this.handlePurchaseError(res, error, {
        userId: req.user.id,
        ticketLotId,
        quantity,
        action: "reserve",
      });
    }
  }

  /**
   * Consulta status consolidado da reserva para polling do cliente.
   * @param req - Parâmetro `reservationId` na URL.
   * @param res - Resposta HTTP com {@link ReservationStatusView} ou erro.
   */
  async getReservationStatus(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const reservationId = req.params.reservationId;

    if (typeof reservationId !== "string" || reservationId.length === 0) {
      res.status(400).json({
        error: "reservationId is required",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    try {
      const status = await reservationStatusService.getStatus(
        reservationId,
        req.user.id,
      );

      res.status(200).json(status);
    } catch (error) {
      this.handlePurchaseError(res, error, {
        userId: req.user.id,
        reservationId,
        action: "getReservationStatus",
      });
    }
  }

  /**
   * Estatísticas das filas Redis (admin/produtor).
   * @param _req - Requisição (não utilizada).
   * @param res - JSON com profundidade das filas.
   */
  async getQueueStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await queueMonitorService.getStats();
      res.status(200).json(stats);
    } catch (error) {
      logger.error(CONTEXT, "Failed to read queue stats", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        error: "Failed to read queue stats",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * Métricas do {@link ReservationPersistenceWorker} em execução.
   * @param _req - Requisição (não utilizada).
   * @param res - Métricas ou 503 se o worker não estiver registrado.
   */
  async getWorkerMetrics(_req: Request, res: Response): Promise<void> {
    const worker = getReservationPersistenceWorker();
    if (!worker) {
      res.status(503).json({
        error: "ReservationPersistenceWorker is not running",
        code: "WORKER_NOT_RUNNING",
      });
      return;
    }

    res.status(200).json({
      worker: "ReservationPersistenceWorker",
      metrics: worker.getMetrics(),
      sampledAt: new Date().toISOString(),
    });
  }

  /**
   * Lista amostra de itens na dead-letter queue de persistência.
   * @param _req - Query `size` opcional (1–200).
   * @param res - Itens parseados da DLQ.
   */
  async listDlq(_req: Request, res: Response): Promise<void> {
    const redis = getRedis();

    const size = Number((_req.query.size as string) ?? "20");
    const limit = Number.isFinite(size) ? Math.max(1, Math.min(200, size)) : 20;

    const [length, items] = await Promise.all([
      redis.llen(RESERVATION_PERSIST_DLQ_KEY),
      redis.lrange(RESERVATION_PERSIST_DLQ_KEY, 0, limit - 1),
    ]);

    res.status(200).json({
      dlqKey: RESERVATION_PERSIST_DLQ_KEY,
      length,
      items: items.map((raw) => {
        try {
          return JSON.parse(raw);
        } catch {
          return { raw };
        }
      }),
      sampledAt: new Date().toISOString(),
    });
  }

  /**
   * Agenda de retentativas futuras (sorted set Redis).
   * @param req - Query `size` opcional.
   * @param res - Entradas agendadas ou 500 em falha de leitura.
   */
  async getRetrySchedule(req: Request, res: Response): Promise<void> {
    try {
      const size = Number((req.query.size as string) ?? "20");
      const limit = Number.isFinite(size) ? Math.max(1, Math.min(200, size)) : 20;
      const schedule = await queueMonitorService.getRetrySchedule(limit);
      res.status(200).json(schedule);
    } catch (error) {
      logger.error(CONTEXT, "Failed to read retry schedule", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        error: "Failed to read retry schedule",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * Move itens da DLQ de volta para a fila de retry imediato.
   * @param req - Body `count` opcional (1–500, padrão 10).
   * @param res - Quantidade movida e tamanhos atuais das filas.
   */
  async reprocessDlq(req: Request, res: Response): Promise<void> {
    const redis = getRedis();

    const { count } = req.body as { count?: number };
    const requested = Number(count ?? 10);
    const toMove = Number.isFinite(requested)
      ? Math.max(1, Math.min(500, requested))
      : 10;

    let moved = 0;

    for (let i = 0; i < toMove; i += 1) {
      const raw = await redis.rpop(RESERVATION_PERSIST_DLQ_KEY);
      if (!raw) break;

      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        payload = { raw };
      }

      const cleaned = {
        reservationId: payload.reservationId,
        userId: payload.userId,
        ticketLotId: payload.ticketLotId,
        quantity: payload.quantity,
        expiresAt: payload.expiresAt,
        attempt: 1,
      };

      // Empurra para retry imediato para reprocessar rapidamente.
      await redis.lpush(RESERVATION_PERSIST_RETRY_QUEUE_KEY, JSON.stringify(cleaned));
      moved += 1;
    }

    const [dlqLength, retryQueueLength, retryScheduled] = await Promise.all([
      redis.llen(RESERVATION_PERSIST_DLQ_KEY),
      redis.llen(RESERVATION_PERSIST_RETRY_QUEUE_KEY),
      redis.zcard(RESERVATION_PERSIST_RETRY_SCHEDULE_KEY),
    ]);

    res.status(200).json({
      moved,
      dlq: { key: RESERVATION_PERSIST_DLQ_KEY, length: dlqLength },
      retry: {
        queueKey: RESERVATION_PERSIST_RETRY_QUEUE_KEY,
        queueLength: retryQueueLength,
        scheduleKey: RESERVATION_PERSIST_RETRY_SCHEDULE_KEY,
        scheduled: retryScheduled,
      },
      sampledAt: new Date().toISOString(),
    });
  }

  private handlePurchaseError(
    res: Response,
    error: unknown,
    context: Record<string, unknown>,
  ): void {
    logger.error(CONTEXT, "Purchase operation failed", {
      ...context,
      error: error instanceof Error ? error.message : String(error),
      code: error instanceof PurchaseError ? error.code : "INTERNAL_ERROR",
    });

    if (error instanceof ReservationNotFoundError) {
      res.status(404).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof ReservationAccessDeniedError) {
      res.status(403).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof PurchaseError) {
      const status =
        error.code === "INSUFFICIENT_STOCK"
          ? 409
          : error.code === "RESERVATION_ACCESS_DENIED"
            ? 403
            : 400;
      res.status(status).json({ error: error.message, code: error.code });
      return;
    }

    res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
}

/** Instância singleton do controlador de compras. */
export const purchaseController = new PurchaseController();
