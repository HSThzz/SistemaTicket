import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Logger } from "../config/logger";
import { getRedis } from "../config/redis";
import {
  RESERVATION_PERSIST_DLQ_KEY,
  RESERVATION_PERSIST_RETRY_QUEUE_KEY,
  RESERVATION_PERSIST_RETRY_SCHEDULE_KEY,
} from "../config/constants";
import {
  PurchaseError,
  ReservationAccessDeniedError,
  ReservationNotFoundError,
} from "../errors/PurchaseError";
import { getReservationPersistenceWorker } from "../runtime/workerRegistry";
import { QueueMonitorService } from "../services/QueueMonitorService";
import { ReservationStatusService } from "../services/ReservationStatusService";
import { PurchaseService } from "../services/PurchaseService";

const CONTEXT = "PurchaseController";
const logger = Logger.getInstance();
const purchaseService = new PurchaseService(AppDataSource, getRedis());
const reservationStatusService = new ReservationStatusService(
  AppDataSource,
  getRedis(),
);
const queueMonitorService = new QueueMonitorService(getRedis());

export class PurchaseController {
  async reserve(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const { ticketLotId, quantity } = req.body as {
      ticketLotId?: string;
      quantity?: number;
    };

    if (!ticketLotId || quantity === undefined) {
      res.status(400).json({
        error: "ticketLotId and quantity are required",
        code: "VALIDATION_ERROR",
      });
      return;
    }

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

export const purchaseController = new PurchaseController();
