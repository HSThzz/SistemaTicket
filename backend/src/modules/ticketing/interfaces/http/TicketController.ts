/**
 * @file Controlador HTTP de listagem de ingressos do cliente.
 * @module ticketing/interfaces/http/TicketController
 */

import type { Request, Response } from "express";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { ValidationError } from "../../../../shared/kernel/validateSchema";
import { listUserTickets } from "../../application/services/listUserTickets";
import { issueManualTicket } from "../../application/services/issueManualTicket";
import {
  ManualTicketError,
  ManualTicketEventNotIssuableError,
  ManualTicketForbiddenError,
  ManualTicketInsufficientStockError,
  ManualTicketLotNotFoundError,
  ManualTicketUserNotFoundError,
} from "../../domain/errors/ManualTicketError";

const CONTEXT = "TicketController";
const logger = Logger.getInstance();

/**
 * Endpoints de consulta de ingressos do usuário autenticado.
 */
export class TicketController {
  /**
   * @param req - Usuário em `req.user`; query `limit` e `cursor` opcionais.
   * @param res - `{ tickets, nextCursor, hasNextPage }`.
   */
  async listMine(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    try {
      const result = await listUserTickets(req.user.id, req.query);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          error: error.message,
          code: error.code,
          field: error.issues[0]?.path || undefined,
        });
        return;
      }

      logger.error(CONTEXT, "Failed to list user tickets", {
        userId: req.user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: "Failed to list tickets", code: "INTERNAL_ERROR" });
    }
  }

  /**
   * POST /tickets/admin/issue — emite ingressos manualmente para um usuário (super admin).
   */
  async issueManual(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    try {
      const issue = await issueManualTicket(req.body, {
        userId: req.user.id,
        role: req.user.role,
      });

      res.status(201).json({
        issue,
        message: issue.emailQueued
          ? "Ingressos emitidos e e-mail enfileirado para envio."
          : "Ingressos emitidos com sucesso.",
      });
    } catch (error) {
      this.handleManualIssueError(res, error);
    }
  }

  private handleManualIssueError(res: Response, error: unknown): void {
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: error.message,
        code: error.code,
        field: error.issues[0]?.path || undefined,
      });
      return;
    }

    if (error instanceof ManualTicketForbiddenError) {
      res.status(403).json({ error: error.message, code: error.code });
      return;
    }

    if (
      error instanceof ManualTicketUserNotFoundError ||
      error instanceof ManualTicketLotNotFoundError
    ) {
      res.status(404).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof ManualTicketInsufficientStockError) {
      res.status(409).json({
        error: error.message,
        code: error.code,
        available: error.available,
      });
      return;
    }

    if (error instanceof ManualTicketEventNotIssuableError) {
      res.status(409).json({
        error: error.message,
        code: error.code,
        eventStatus: error.eventStatus,
      });
      return;
    }

    if (error instanceof ManualTicketError) {
      res.status(400).json({ error: error.message, code: error.code });
      return;
    }

    logger.error(CONTEXT, "Failed to issue manual tickets", {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: "Failed to issue tickets", code: "INTERNAL_ERROR" });
  }
}

/** Instância singleton do controlador de ingressos. */
export const ticketController = new TicketController();
