import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Logger } from "../config/logger";
import { getRedis } from "../config/redis";
import {
  OrderAlreadyRefundedError,
  OrderNotFoundError,
  OrderRefundNotAllowedError,
  PaymentError,
  PaymentGatewayError,
} from "../errors/PaymentError";
import { OrderQueryService } from "../services/OrderQueryService";
import { PaymentService } from "../services/PaymentService";

const CONTEXT = "OrderController";
const logger = Logger.getInstance();
const paymentService = new PaymentService(AppDataSource, getRedis());
const orderQueryService = new OrderQueryService(AppDataSource, paymentService);

function parseOrderId(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
}

export class OrderController {
  async getPayment(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const orderId = parseOrderId(req.params.id);

    if (!orderId) {
      res.status(400).json({ error: "Invalid order id", code: "INVALID_ORDER_ID" });
      return;
    }

    try {
      const payment = await paymentService.getOrderPixPayment(orderId, req.user.id);
      res.status(200).json({ payment });
    } catch (error) {
      if (error instanceof OrderNotFoundError) {
        res.status(404).json({ error: error.message, code: error.code });
        return;
      }

      if (error instanceof PaymentGatewayError) {
        res.status(404).json({ error: error.message, code: error.code });
        return;
      }

      logger.error(CONTEXT, "Failed to get order payment", {
        orderId,
        userId: req.user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: "Failed to get payment", code: "INTERNAL_ERROR" });
    }
  }

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

  async refund(req: Request, res: Response): Promise<void> {
    const orderId = parseOrderId(req.params.id);

    if (!orderId) {
      res.status(400).json({ error: "Invalid order id", code: "INVALID_ORDER_ID" });
      return;
    }

    try {
      const result = await paymentService.refundOrder(orderId);
      res.status(200).json({ refund: result });
    } catch (error) {
      this.handleRefundError(res, orderId, error);
    }
  }

  private handleRefundError(res: Response, orderId: string, error: unknown): void {
    if (error instanceof OrderNotFoundError) {
      res.status(404).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof OrderAlreadyRefundedError) {
      res.status(409).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof OrderRefundNotAllowedError) {
      res.status(422).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof PaymentGatewayError) {
      logger.error(CONTEXT, "Gateway refund failed", {
        orderId,
        error: error.message,
        code: error.code,
      });
      res.status(502).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof PaymentError) {
      res.status(400).json({ error: error.message, code: error.code });
      return;
    }

    logger.error(CONTEXT, "Unexpected refund error", {
      orderId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: "Failed to refund order", code: "INTERNAL_ERROR" });
  }
}

export const orderController = new OrderController();
