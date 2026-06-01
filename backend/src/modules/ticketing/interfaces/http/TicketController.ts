import type { Request, Response } from "express";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { TicketQueryService } from "../../application/TicketQueryService";

const CONTEXT = "TicketController";
const logger = Logger.getInstance();
const ticketQueryService = new TicketQueryService(AppDataSource);

export class TicketController {
  async listMine(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    try {
      const tickets = await ticketQueryService.listUserTickets(req.user.id);
      res.status(200).json({ tickets });
    } catch (error) {
      logger.error(CONTEXT, "Failed to list user tickets", {
        userId: req.user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: "Failed to list tickets", code: "INTERNAL_ERROR" });
    }
  }
}

export const ticketController = new TicketController();

