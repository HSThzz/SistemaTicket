/**
 * @file Controlador HTTP de check-in na portaria.
 * @module ticketing/interfaces/http/CheckInController
 */

import type { Request, Response } from "express";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import {
  CheckInAccessDeniedError,
  CheckInError,
  CheckInNotAllowedTodayError,
  EventNotPublishedError,
  InvalidTicketStatusError,
  TicketNotFoundError,
} from "../../domain/errors/CheckInError";
import { checkIn } from "../../application/services/checkIn";
import { previewCheckIn } from "../../application/services/previewCheckIn";
import { listCheckInEvents } from "../../application/services/listCheckInEvents";
import { userHasCheckInAccess } from "../../application/queries/userHasCheckInAccess";
import type { CheckInPreviewResult, CheckInResult } from "../../application/services/types";

const CONTEXT = "CheckInController";
const logger = Logger.getInstance();

function serializePreview(result: CheckInPreviewResult) {
  return {
    owner_name: result.ownerName,
    owner_document: result.ownerDocument,
    ticket_id: result.ticketId,
    event_title: result.eventTitle,
    lot_name: result.lotName,
    lot_price: result.lotPrice,
  };
}

function serializeCheckIn(result: CheckInResult) {
  return {
    ...serializePreview(result),
    checked_in_at: result.checkedInAt,
  };
}

/**
 * Endpoint de validação de ingresso por código único.
 */
export class CheckInController {
  /**
   * GET /tickets/check-in/access — se o usuário pode abrir a área de check-in.
   */
  async access(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const canCheckIn = await userHasCheckInAccess({
      userId: req.user.id,
      role: req.user.role,
    });

    res.status(200).json({ canCheckIn });
  }

  /**
   * GET /tickets/check-in/events — eventos do dia em que o ator pode validar.
   */
  async listEvents(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const events = await listCheckInEvents({
      userId: req.user.id,
      role: req.user.role,
    });

    res.status(200).json({ events });
  }

  /**
   * POST /tickets/check-in/preview — valida e devolve dados sem marcar usado.
   */
  async preview(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const { unique_code: uniqueCode } = req.body as { unique_code: string };

    try {
      const result = await previewCheckIn(uniqueCode, {
        userId: req.user.id,
        role: req.user.role,
      });

      res.status(200).json(serializePreview(result));
    } catch (error) {
      this.handleError(res, uniqueCode, error);
    }
  }

  /**
   * POST /tickets/check-in — confirma entrada e marca ingresso como usado.
   */
  async checkIn(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const { unique_code: uniqueCode } = req.body as { unique_code: string };

    try {
      const result = await checkIn(uniqueCode, {
        userId: req.user.id,
        role: req.user.role,
      });

      res.status(200).json(serializeCheckIn(result));
    } catch (error) {
      this.handleError(res, uniqueCode, error);
    }
  }

  private handleError(res: Response, uniqueCode: string, error: unknown): void {
    if (error instanceof InvalidTicketStatusError) {
      res.status(400).json({
        error: error.message,
        code: error.code,
        currentStatus: error.currentStatus,
      });
      return;
    }

    if (error instanceof EventNotPublishedError) {
      res.status(400).json({
        error: error.message,
        code: error.code,
        eventStatus: error.eventStatus,
      });
      return;
    }

    if (error instanceof CheckInNotAllowedTodayError) {
      res.status(400).json({
        error: error.message,
        code: error.code,
        eventDate: error.eventDate,
      });
      return;
    }

    if (error instanceof CheckInAccessDeniedError) {
      res.status(403).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof TicketNotFoundError) {
      res.status(404).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof CheckInError) {
      logger.error(CONTEXT, "Check-in error", {
        uniqueCode,
        code: error.code,
        error: error.message,
      });
      res.status(400).json({ error: error.message, code: error.code });
      return;
    }

    logger.error(CONTEXT, "Unexpected check-in error", {
      uniqueCode,
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      error: "Failed to process check-in",
      code: "INTERNAL_ERROR",
    });
  }
}

/** Instância singleton do controlador de check-in. */
export const checkInController = new CheckInController();
