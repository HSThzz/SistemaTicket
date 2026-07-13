/**
 * @file Controlador HTTP de pedidos do cliente: listagem, PIX e reembolso (admin).
 * @module sales/interfaces/http/OrderController
 */

import type { Request, Response } from "express";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { getRedis } from "../../../../shared/infrastructure/config/redis";
import { ValidationError } from "../../../../shared/kernel/validateSchema";
import {
  OrderAlreadyRefundedError,
  OrderNotFoundError,
  OrderRefundNotAllowedError,
  PaymentError,
  PaymentGatewayError,
} from "../../../payment/domain/errors/PaymentError";
import { getOrderPixPayment } from "../../../payment/application/services/getOrderPixPayment";
import { refundOrder } from "../../../payment/application/services/refundOrder";
import { createPaymentGateway } from "../../../payment/infrastructure/gateways/createPaymentGateway";
import { AdminAuditAction } from "../../../../shared/kernel/enums";
import { createAdminAuditLog } from "../../../identity/application/commands/createAdminAuditLog";
import { getOrderByIdForAdmin } from "../../application/services/getOrderByIdForAdmin";
import { listUserOrders } from "../../application/services/listUserOrders";

const CONTEXT = "OrderController";
const logger = Logger.getInstance();
const redis = getRedis();
const paymentGateway = createPaymentGateway();

function parseOrderId(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
}

/**
 * Endpoints de consulta e reembolso de pedidos.
 */
export class OrderController {
  /**
   * Retorna dados PIX do pedido para o dono autenticado.
   * @param req - Parâmetro `id` do pedido.
   * @param res - `{ payment }` ou erro 404/502.
   */
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
      const payment = await getOrderPixPayment(redis,
        orderId,
        req.user.id,
        paymentGateway,
      );
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

  /**
   * Lista pedidos do usuário autenticado com evento e PIX pendente.
   * @param req - Usuário em `req.user`; query `limit`, `cursor` e `status` opcionais.
   * @param res - `{ orders, nextCursor, hasNextPage }`.
   */
  async listMine(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    try {
      const result = await listUserOrders(req.user.id, req.query, redis);
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

      logger.error(CONTEXT, "Failed to list user orders", {
        userId: req.user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: "Failed to list orders", code: "INTERNAL_ERROR" });
    }
  }

  /**
   * Detalhes de pedido para admin (confirmação antes de reembolso).
   */
  async getByIdAdmin(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };

    try {
      const order = await getOrderByIdForAdmin(id, redis);
      res.status(200).json({ order });
    } catch (error) {
      if (error instanceof OrderNotFoundError) {
        res.status(404).json({ error: error.message, code: error.code });
        return;
      }

      logger.error(CONTEXT, "Failed to get order for admin", {
        orderId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: "Failed to get order", code: "INTERNAL_ERROR" });
    }
  }

  /**
   * Reembolsa pedido pago (somente admin via rota).
   * @param req - Parâmetro `id` do pedido.
   * @param res - `{ refund }` ou erro de negócio/gateway.
   */
  async refund(req: Request, res: Response): Promise<void> {
    const orderId = parseOrderId(req.params.id);

    if (!orderId) {
      res.status(400).json({ error: "Invalid order id", code: "INVALID_ORDER_ID" });
      return;
    }

    try {
      const result = await refundOrder(redis,
        orderId,
        paymentGateway,
      );

      if (req.user) {
        await createAdminAuditLog({
          actorUserId: req.user.id,
          action: AdminAuditAction.ORDER_REFUNDED,
          targetType: "order",
          targetId: orderId,
          metadata: {
            ticketsCancelled: result.ticketsCancelled,
            stockRestored: result.stockRestored,
          },
        });
      }

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
      const status = error.code === "REFUND_LOCAL_STATE_ERROR" ? 500 : 400;
      res.status(status).json({ error: error.message, code: error.code });
      return;
    }

    logger.error(CONTEXT, "Unexpected refund error", {
      orderId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: "Failed to refund order", code: "INTERNAL_ERROR" });
  }
}

/** Instância singleton do controlador de pedidos. */
export const orderController = new OrderController();
