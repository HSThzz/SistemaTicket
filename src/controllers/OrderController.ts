import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Logger } from "../config/logger";
import { OrderQueryService } from "../services/OrderQueryService";

const CONTEXT = "OrderController";
const logger = Logger.getInstance();
const orderQueryService = new OrderQueryService(AppDataSource);

export class OrderController {
  async listMine(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    try {
      const orders = await orderQueryService.listUserOrders(req.user.id);
      res.status(200).json({ orders });
    } catch (error) {
      logger.error(CONTEXT, "Failed to list user orders", {
        userId: req.user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: "Failed to list orders", code: "INTERNAL_ERROR" });
    }
  }
}

export const orderController = new OrderController();

