/**
 * @file Controlador HTTP de webhooks de pagamento e simulação em desenvolvimento.
 * @module payment/interfaces/http/PaymentController
 */

import type { Request, Response } from "express";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { isProduction } from "../../../../shared/infrastructure/config/env";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { getRedis } from "../../../../shared/infrastructure/config/redis";
import {
  InvalidWebhookPayloadError,
  OrderNotFoundError,
  PaymentAlreadyProcessedError,
  PaymentError,
  WebhookReplayError,
  WebhookUnauthorizedError,
} from "../../../payment/domain/errors/PaymentError";
import {
  PaymentService,
  type PaymentWebhookPayload,
} from "../../application/PaymentService";
import { WebhookAuthService } from "../../infrastructure/gateways/WebhookAuthService";
import {
  extractMercadoPagoPaymentId,
  isMercadoPagoWebhookRequest,
} from "../../infrastructure/gateways/mercadoPagoWebhook";

const CONTEXT = "PaymentController";
const logger = Logger.getInstance();
const paymentService = new PaymentService(AppDataSource, getRedis());
const webhookAuthService = new WebhookAuthService(getRedis());

/**
 * Recebe webhooks internos e Mercado Pago após autenticação.
 */
export class PaymentController {
  /**
   * Simula pagamento PIX aprovado (não disponível em produção).
   * @param req - Body `{ orderId }` e usuário autenticado.
   * @param res - `{ simulated: true }` ou erro mapeado de webhook.
   */
  async simulateDevPayment(req: Request, res: Response): Promise<void> {
    if (isProduction) {
      res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const { orderId } = req.body as { orderId: string };

    try {
      await paymentService.simulateDevPayment(orderId, req.user.id);
      res.status(200).json({ simulated: true, orderId });
    } catch (error) {
      this.handleWebhookError(
        res,
        {
          event: "payment.succeeded",
          data: { orderId, transactionId: "dev_simulate" },
        },
        error,
      );
    }
  }

  /**
   * Endpoint unificado de webhook com anti-replay e roteamento MP vs interno.
   * @param req - Corpo JSON ou notificação Mercado Pago.
   * @param res - 200 com `received` ou erro 4xx/5xx.
   */
  async webhook(req: Request, res: Response): Promise<void> {
    try {
      const auth = await webhookAuthService.authorize(req);
      await webhookAuthService.assertNotReplayed(auth.replayKey);
    } catch (error) {
      this.handleAuthError(res, error);
      return;
    }

    if (isMercadoPagoWebhookRequest(req)) {
      await this.handleMercadoPagoWebhook(req, res);
      return;
    }

    const payload = req.body as PaymentWebhookPayload;

    logger.info(CONTEXT, "Incoming payment webhook", {
      provider: "internal",
      event: payload?.event,
      orderId: payload?.data?.orderId,
      transactionId: payload?.data?.transactionId,
    });

    try {
      await paymentService.handleWebhook(payload);

      logger.info(CONTEXT, "Webhook processed successfully", {
        event: payload.event,
        orderId: payload.data.orderId,
      });

      res.status(200).json({ received: true });
    } catch (error) {
      this.handleWebhookError(res, payload, error);
    }
  }

  private async handleMercadoPagoWebhook(req: Request, res: Response): Promise<void> {
    const paymentId = extractMercadoPagoPaymentId(req);

    if (!paymentId) {
      res.status(400).json({
        error: "Invalid Mercado Pago webhook payload",
        code: "INVALID_WEBHOOK_PAYLOAD",
      });
      return;
    }

    logger.info(CONTEXT, "Incoming Mercado Pago webhook", {
      provider: "mercadopago",
      paymentId,
      gateway: paymentService.getGatewayProvider(),
    });

    try {
      const result = await paymentService.handleMercadoPagoNotification(paymentId);

      res.status(200).json({
        received: true,
        provider: "mercadopago",
        paymentId,
        result,
      });
    } catch (error) {
      this.handleWebhookError(
        res,
        { event: "payment.succeeded", data: { orderId: "", transactionId: paymentId } },
        error,
      );
    }
  }

  private handleAuthError(res: Response, error: unknown): void {
    if (error instanceof WebhookReplayError) {
      res.status(200).json({ received: true, duplicate: true });
      return;
    }

    if (error instanceof WebhookUnauthorizedError) {
      res.status(401).json({ error: error.message, code: error.code });
      return;
    }

    logger.error(CONTEXT, "Webhook auth failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(401).json({ error: "Unauthorized webhook", code: "WEBHOOK_UNAUTHORIZED" });
  }

  private handleWebhookError(
    res: Response,
    payload: PaymentWebhookPayload,
    error: unknown,
  ): void {
    logger.error(CONTEXT, "Webhook processing failed", {
      event: payload?.event,
      orderId: payload?.data?.orderId,
      transactionId: payload?.data?.transactionId,
      error: error instanceof Error ? error.message : String(error),
      code: error instanceof PaymentError ? error.code : "INTERNAL_ERROR",
    });

    if (error instanceof InvalidWebhookPayloadError) {
      res.status(400).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof OrderNotFoundError) {
      res.status(404).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof PaymentAlreadyProcessedError) {
      res.status(200).json({ received: true, duplicate: true });
      return;
    }

    res.status(500).json({
      error: "Webhook processing failed",
      code: "INTERNAL_ERROR",
    });
  }
}

/** Instância singleton do controlador de pagamentos. */
export const paymentController = new PaymentController();
