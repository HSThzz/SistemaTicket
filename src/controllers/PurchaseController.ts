import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Logger } from "../config/logger";
import { getRedis } from "../config/redis";
import {
  PurchaseError,
  ReservationAccessDeniedError,
  ReservationNotFoundError,
} from "../errors/PurchaseError";
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
