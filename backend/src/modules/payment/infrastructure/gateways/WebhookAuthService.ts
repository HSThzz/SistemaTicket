/**
 * @file Autenticação, validação de assinatura e anti-replay de webhooks de pagamento.
 * @module payment/infrastructure/gateways/WebhookAuthService
 */

import { createHash } from "node:crypto";
import type { Request } from "express";
import type Redis from "ioredis";
import {
  env,
  isMercadoPagoSandbox,
  isProduction,
} from "../../../../shared/infrastructure/config/env";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { WebhookReplayError, WebhookUnauthorizedError } from "../../domain/errors/PaymentError";
import {
  buildInternalWebhookSignature,
  getInternalWebhookRawBody,
  isInternalTimestampValid,
  verifyInternalWebhookSignature,
} from "./internalWebhookSignature";
import {
  extractMercadoPagoManifestId,
  isTimestampWithinMaxAge,
  parseMercadoPagoSignatureHeader,
  verifyMercadoPagoSignatureForRequest,
} from "./mercadoPagoSignature";
import {
  isMercadoPagoPanelTestRequest,
  isMercadoPagoWebhookRequest,
} from "./mercadoPagoWebhook";

const CONTEXT = "WebhookAuthService";
const REPLAY_KEY_PREFIX = "webhook:dedupe:";
const REPLAY_TTL_SECONDS = 24 * 60 * 60;

/**
 * Resultado da autorização com chave para deduplicação no Redis.
 */
export interface WebhookAuthResult {
  replayKey: string;
}

/**
 * Valida webhooks Mercado Pago e internos antes do processamento de pagamento.
 */
export class WebhookAuthService {
  private readonly logger = Logger.getInstance();

  /**
   * @param redis - Cliente Redis para chaves `SET NX` de anti-replay.
   */
  constructor(private readonly redis: Redis) {}

  /**
   * @param req - Requisição com headers `x-signature` / `x-request-id` ou fallback legado.
   * @returns Chave de deduplicação exclusiva por notificação.
   * @throws {WebhookUnauthorizedError} Se assinatura ou timestamp forem inválidos.
   */
  async authorizeMercadoPago(req: Request): Promise<WebhookAuthResult> {
    if (isMercadoPagoPanelTestRequest(req)) {
      this.logger.info(CONTEXT, "Mercado Pago panel URL test accepted");
      return {
        replayKey: `${REPLAY_KEY_PREFIX}mercadopago-panel:${Date.now()}`,
      };
    }

    const xSignature = req.header("x-signature");
    const xRequestId = req.header("x-request-id");
    const secret = env.payment.mercadoPago.webhookSecret.trim();

    if (xSignature && xRequestId && secret) {
      const parsed = parseMercadoPagoSignatureHeader(xSignature);
      const dataId = extractMercadoPagoManifestId(req);

      if (!parsed || !dataId) {
        throw new WebhookUnauthorizedError("Invalid Mercado Pago signature headers");
      }

      if (!isTimestampWithinMaxAge(parsed.ts, env.payment.webhookMaxAgeSeconds)) {
        this.logger.warn(CONTEXT, "Mercado Pago webhook timestamp rejected", {
          dataId,
          requestId: xRequestId,
          ts: parsed.ts,
          maxAgeSeconds: env.payment.webhookMaxAgeSeconds,
        });
        throw new WebhookUnauthorizedError("Mercado Pago webhook timestamp expired");
      }

      const valid = verifyMercadoPagoSignatureForRequest({
        req,
        requestId: xRequestId,
        ts: parsed.ts,
        secret,
        receivedSignature: parsed.v1,
      });

      if (!valid) {
        const topic = typeof req.query.topic === "string" ? req.query.topic : null;
        const ipnPaymentId = extractMercadoPagoManifestId(req);

        // IPN legado (?id=&topic=payment): assinatura costuma divergir; worker confirma na API do MP.
        if (topic === "payment" && ipnPaymentId) {
          this.logger.info(
            CONTEXT,
            "Mercado Pago IPN webhook accepted (signature skipped, verified via API in worker)",
            { paymentId: ipnPaymentId, requestId: xRequestId },
          );
          return {
            replayKey: `${REPLAY_KEY_PREFIX}mercadopago-ipn:${xRequestId}:${ipnPaymentId}`,
          };
        }

        this.logger.warn(CONTEXT, "Mercado Pago signature mismatch", {
          dataId,
          requestId: xRequestId,
        });
        throw new WebhookUnauthorizedError("Invalid Mercado Pago webhook signature");
      }

      return { replayKey: `${REPLAY_KEY_PREFIX}mercadopago:${xRequestId}` };
    }

    const requiresSignedWebhook =
      isProduction &&
      env.payment.gateway === "mercadopago" &&
      !isMercadoPagoSandbox();

    if (requiresSignedWebhook) {
      const dataId = extractMercadoPagoManifestId(req);
      this.logger.warn(CONTEXT, "Mercado Pago webhook rejected in production", {
        hasSignatureHeader: Boolean(xSignature),
        hasRequestIdHeader: Boolean(xRequestId),
        hasWebhookSecret: Boolean(secret),
        dataId,
        hint: !secret
          ? "Set MERCADOPAGO_WEBHOOK_SECRET to the secret key from MP Developers → Webhooks (not the access token)"
          : !xSignature || !xRequestId
            ? "Mercado Pago did not send x-signature/x-request-id headers"
            : "Signature mismatch — re-copy MERCADOPAGO_WEBHOOK_SECRET from the MP panel",
      });

      throw new WebhookUnauthorizedError(
        "Mercado Pago webhook requires valid x-signature validation in production",
      );
    }

    if (this.isLegacySecretAuthorized(req)) {
      this.logger.warn(CONTEXT, "Mercado Pago webhook accepted via legacy secret");
      const paymentId = extractMercadoPagoManifestId(req) ?? "unknown";
      return {
        replayKey: `${REPLAY_KEY_PREFIX}mercadopago-legacy:${paymentId}:${req.header("x-webhook-timestamp") ?? Date.now()}`,
      };
    }

    if (!isProduction || isMercadoPagoSandbox()) {
      this.logger.warn(CONTEXT, "Mercado Pago webhook accepted without signature (dev/sandbox)", {
        nodeEnv: env.nodeEnv,
        sandbox: isMercadoPagoSandbox(),
      });
      const paymentId = extractMercadoPagoManifestId(req) ?? "unknown";
      return {
        replayKey: `${REPLAY_KEY_PREFIX}mercadopago-open:${paymentId}:${Date.now()}`,
      };
    }

    throw new WebhookUnauthorizedError("Unauthorized Mercado Pago webhook");
  }

  /**
   * @param req - Requisição com HMAC em `x-webhook-signature` e `x-webhook-timestamp`.
   * @returns Chave de deduplicação baseada em timestamp e hash do corpo.
   * @throws {WebhookUnauthorizedError} Em produção sem headers obrigatórios.
   */
  async authorizeInternal(req: Request): Promise<WebhookAuthResult> {
    const secret = env.payment.webhookSecret;
    const timestamp = req.header("x-webhook-timestamp");
    const signature = req.header("x-webhook-signature");

    if (secret && timestamp && signature) {
      const rawBody = getInternalWebhookRawBody(req);

      if (!isInternalTimestampValid(timestamp, env.payment.webhookMaxAgeSeconds)) {
        throw new WebhookUnauthorizedError("Webhook timestamp expired or invalid");
      }

      const valid = verifyInternalWebhookSignature({
        secret,
        timestamp,
        rawBody,
        receivedSignature: signature,
      });

      if (!valid) {
        throw new WebhookUnauthorizedError("Invalid webhook HMAC signature");
      }

      const bodyHash = createHash("sha256").update(rawBody).digest("hex");
      return {
        replayKey: `${REPLAY_KEY_PREFIX}internal:${timestamp}:${bodyHash}`,
      };
    }

    if (isProduction) {
      throw new WebhookUnauthorizedError(
        "Internal webhook requires x-webhook-timestamp and x-webhook-signature in production",
      );
    }

    if (this.isLegacySecretAuthorized(req)) {
      this.logger.warn(CONTEXT, "Internal webhook accepted via legacy secret (non-production)");
      const rawBody = getInternalWebhookRawBody(req);
      const bodyHash = createHash("sha256").update(rawBody).digest("hex");
      return {
        replayKey: `${REPLAY_KEY_PREFIX}internal-legacy:${bodyHash}`,
      };
    }

    if (!secret) {
      this.logger.warn(CONTEXT, "Internal webhook accepted without auth (non-production, no secret)");
      const rawBody = getInternalWebhookRawBody(req);
      const bodyHash = createHash("sha256").update(rawBody).digest("hex");
      return {
        replayKey: `${REPLAY_KEY_PREFIX}internal-open:${bodyHash}:${Date.now()}`,
      };
    }

    throw new WebhookUnauthorizedError("Unauthorized internal webhook");
  }

  /**
   * Despacha para Mercado Pago ou webhook interno conforme o payload.
   * @param req - Requisição HTTP do webhook.
   * @returns Resultado com `replayKey` para {@link assertNotReplayed}.
   */
  async authorize(req: Request): Promise<WebhookAuthResult> {
    if (isMercadoPagoWebhookRequest(req)) {
      return this.authorizeMercadoPago(req);
    }

    return this.authorizeInternal(req);
  }

  /**
   * @param replayKey - Chave única da notificação.
   * @throws {WebhookReplayError} Se a chave já existir no Redis (TTL 24h).
   */
  async assertNotReplayed(replayKey: string): Promise<void> {
    const inserted = await this.redis.set(replayKey, "1", "EX", REPLAY_TTL_SECONDS, "NX");

    if (inserted !== "OK") {
      throw new WebhookReplayError();
    }
  }

  private isLegacySecretAuthorized(req: Request): boolean {
    const secret = env.payment.webhookSecret;
    if (!secret) {
      return false;
    }

    return (req.header("x-webhook-secret") ?? "") === secret;
  }
}

/**
 * Gera headers de assinatura para testes ou emissão de webhooks internos.
 * @param params - Secret, corpo JSON e timestamp opcional.
 * @returns Timestamp, assinatura hex e corpo serializado.
 */
export function signInternalWebhookPayload(params: {
  secret: string;
  body: unknown;
  timestamp?: string;
}): { timestamp: string; signature: string; body: string } {
  const timestamp = params.timestamp ?? String(Date.now());
  const body = JSON.stringify(params.body);
  const signature = buildInternalWebhookSignature({
    secret: params.secret,
    timestamp,
    rawBody: body,
  });

  return { timestamp, signature, body };
}
