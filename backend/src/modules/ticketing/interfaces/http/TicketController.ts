/**
 * @file Controlador HTTP de listagem de ingressos do cliente.
 * @module ticketing/interfaces/http/TicketController
 */

import type { Request, Response } from "express";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { ValidationError } from "../../../../shared/kernel/validateSchema";
import { listUserTickets } from "../../application/services/listUserTickets";

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
}

/** Instância singleton do controlador de ingressos. */
export const ticketController = new TicketController();
