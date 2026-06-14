/**
 * @file Controlador HTTP de webhooks de pagamento e simulação em desenvolvimento.
 * @module payment/interfaces/http/PaymentController
 */

import type { Request, Response } from "express";
import { isProduction } from "../../../../shared/infrastructure/config/env";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { getRedis } from "../../../../shared/infrastructure/config/redis";
import {
  CardPaymentUnsupportedError,
  InvalidWebhookPayloadError,
  OrderNotFoundError,
  PaymentAlreadyProcessedError,
  PaymentError,
  PaymentGatewayError,
  WebhookReplayError,
  WebhookUnauthorizedError,
} from "../../../payment/domain/errors/PaymentError";
import type { PaymentWebhookPayload } from "../../application/types";
import { createPaymentGateway } from "../../infrastructure/gateways/createPaymentGateway";
import { WebhookAuthService } from "../../infrastructure/gateways/WebhookAuthService";
import {
  extractMercadoPagoPaymentId,
  isMercadoPagoPanelTestRequest,
  isMercadoPagoWebhookRequest,
} from "../../infrastructure/gateways/mercadoPagoWebhook";
import { handleMercadoPagoNotification } from "../../application/services/handleMercadoPagoNotification";
import { handleWebhook } from "../../application/services/handleWebhook";
import { createOrderPixPayment } from "../../application/services/createOrderPixPayment";
import { getPaymentConfig } from "../../application/services/getPaymentConfig";
import { processCardPayment } from "../../application/services/processCardPayment";
import { simulateDevPayment } from "../../application/services/simulateDevPayment";
import { ValidationError } from "../../../../shared/kernel/validateSchema";

const CONTEXT = "PaymentController";
const logger = Logger.getInstance();
const redis = getRedis();
const paymentGateway = createPaymentGateway();
const webhookAuthService = new WebhookAuthService(getRedis());

/**
 * Recebe webhooks internos e Mercado Pago após autenticação.
 */
export class PaymentController {
  /**
   * Expõe configuração pública do checkout (ex.: public key do Mercado Pago).
   * @param _req - Requisição HTTP.
   * @param res - `{ mercadoPagoPublicKey, cardPaymentEnabled, ... }`.
   */
  async getConfig(_req: Request, res: Response): Promise<void> {
    res.status(200).json(getPaymentConfig());
  }

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
      await simulateDevPayment(redis,
        orderId,
        req.user.id,
        paymentGateway,
      );
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
   * Processa pagamento via cartão de crédito usando o token gerado no front-end.
   *
   * O corpo traz `token`, `paymentMethodId`, `installments` e dados do pagador;
   * os dados brutos do cartão nunca chegam ao back-end.
   *
   * @param req - Body validado e usuário autenticado.
   * @param res - `{ status, transactionId }` (`approved`/`pending`/`rejected`) ou erro mapeado.
   */
  async createCardPayment(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const body = req.body as {
      orderId: string;
      token: string;
      paymentMethodId: string;
      installments?: number;
      payerEmail?: string;
      payerDocument?: string;
    };

    try {
      const result = await processCardPayment(redis, {
        ...body,
        requesterUserId: req.user.id,
      });

      res.status(200).json(result);
    } catch (error) {
      this.handleCardPaymentError(res, body.orderId, error);
    }
  }

  /**
   * Gera cobrança PIX sob demanda quando o usuário escolhe PIX no checkout.
   *
   * @param req - Body `{ orderId }` e usuário autenticado.
   * @param res - Detalhes do PIX (`pixCopyPaste`, `expiresAt`, etc.) ou erro mapeado.
   */
  async createPixPayment(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const { orderId } = req.body as { orderId: string };

    try {
      const payment = await createOrderPixPayment(redis, {
        orderId,
        requesterUserId: req.user.id,
      });

      res.status(200).json({ payment });
    } catch (error) {
      this.handleCardPaymentError(res, orderId, error);
    }
  }

  private handleCardPaymentError(
    res: Response,
    orderId: string,
    error: unknown,
  ): void {
    logger.error(CONTEXT, "Order payment failed", {
      orderId,
      error: error instanceof Error ? error.message : String(error),
      code: error instanceof PaymentError ? error.code : "INTERNAL_ERROR",
    });

    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof OrderNotFoundError) {
      res.status(404).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof PaymentAlreadyProcessedError) {
      res.status(409).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof CardPaymentUnsupportedError) {
      res.status(400).json({ error: error.message, code: error.code });
      return;
    }

    if (error instanceof PaymentGatewayError) {
      res.status(502).json({ error: error.message, code: error.code });
      return;
    }

    res.status(500).json({
      error: "Card payment processing failed",
      code: "INTERNAL_ERROR",
    });
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
      await handleWebhook(redis, payload, paymentGateway);

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
    if (isMercadoPagoPanelTestRequest(req)) {
      res.status(200).json({
        received: true,
        provider: "mercadopago",
        test: true,
      });
      return;
    }

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
      gateway: paymentGateway.provider,
    });

    try {
      const result = await handleMercadoPagoNotification(redis,
        paymentId,
        paymentGateway,
      );

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
