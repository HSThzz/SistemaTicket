import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { env, isProduction } from "../config/env";
import { Logger } from "../config/logger";
import { getRedis } from "../config/redis";
import {
  InvalidWebhookPayloadError,
  OrderNotFoundError,
  PaymentAlreadyProcessedError,
  PaymentError,
} from "../errors/PaymentError";
import {
  PaymentService,
  type PaymentWebhookPayload,
} from "../services/PaymentService";

const CONTEXT = "PaymentController";
const logger = Logger.getInstance();
const paymentService = new PaymentService(AppDataSource, getRedis());

export class PaymentController {
  async webhook(req: Request, res: Response): Promise<void> {
    if (!this.isWebhookAuthorized(req)) {
      res.status(401).json({ error: "Unauthorized webhook", code: "WEBHOOK_UNAUTHORIZED" });
      return;
    }

    const payload = req.body as PaymentWebhookPayload;

    logger.info(CONTEXT, "Incoming payment webhook", {
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

  private isWebhookAuthorized(req: Request): boolean {
    const secret = env.payment.webhookSecret;

    if (!secret) {
      if (isProduction) {
        return false;
      }

      logger.warn(CONTEXT, "PAYMENT_WEBHOOK_SECRET not set; accepting webhook in non-production");
      return true;
    }

    const headerValue = req.header("x-webhook-secret") ?? "";
    return headerValue === secret;
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

export const paymentController = new PaymentController();
