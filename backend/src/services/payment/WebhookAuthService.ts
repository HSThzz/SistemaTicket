import { createHash } from "node:crypto";
import type { Request } from "express";
import type Redis from "ioredis";
import { env, isProduction } from "../../config/env";
import { Logger } from "../../config/logger";
import { WebhookReplayError, WebhookUnauthorizedError } from "../../errors/PaymentError";
import {
  buildInternalWebhookSignature,
  getInternalWebhookRawBody,
  isInternalTimestampValid,
  verifyInternalWebhookSignature,
} from "./internalWebhookSignature";
import {
  buildMercadoPagoManifest,
  extractMercadoPagoManifestId,
  isTimestampWithinMaxAge,
  parseMercadoPagoSignatureHeader,
  verifyMercadoPagoSignature,
} from "./mercadoPagoSignature";
import { isMercadoPagoWebhookRequest } from "./mercadoPagoWebhook";

const CONTEXT = "WebhookAuthService";
const REPLAY_KEY_PREFIX = "webhook:dedupe:";
const REPLAY_TTL_SECONDS = 24 * 60 * 60;

export interface WebhookAuthResult {
  replayKey: string;
}

export class WebhookAuthService {
  private readonly logger = Logger.getInstance();

  constructor(private readonly redis: Redis) {}

  async authorizeMercadoPago(req: Request): Promise<WebhookAuthResult> {
    const xSignature = req.header("x-signature");
    const xRequestId = req.header("x-request-id");
    const secret = env.payment.mercadoPago.webhookSecret;

    if (xSignature && xRequestId && secret) {
      const parsed = parseMercadoPagoSignatureHeader(xSignature);
      const dataId = extractMercadoPagoManifestId(req);

      if (!parsed || !dataId) {
        throw new WebhookUnauthorizedError("Invalid Mercado Pago signature headers");
      }

      if (!isTimestampWithinMaxAge(parsed.ts, env.payment.webhookMaxAgeSeconds)) {
        throw new WebhookUnauthorizedError("Mercado Pago webhook timestamp expired");
      }

      const manifest = buildMercadoPagoManifest({
        dataId,
        requestId: xRequestId,
        ts: parsed.ts,
      });

      const valid = verifyMercadoPagoSignature({
        manifest,
        secret,
        receivedSignature: parsed.v1,
      });

      if (!valid) {
        this.logger.warn(CONTEXT, "Mercado Pago signature mismatch", {
          dataId,
          requestId: xRequestId,
        });
        throw new WebhookUnauthorizedError("Invalid Mercado Pago webhook signature");
      }

      return { replayKey: `${REPLAY_KEY_PREFIX}mercadopago:${xRequestId}` };
    }

    if (isProduction && env.payment.gateway === "mercadopago") {
      throw new WebhookUnauthorizedError(
        "Mercado Pago webhook requires x-signature validation in production",
      );
    }

    if (this.isLegacySecretAuthorized(req)) {
      this.logger.warn(CONTEXT, "Mercado Pago webhook accepted via legacy secret (non-production)");
      const paymentId = extractMercadoPagoManifestId(req) ?? "unknown";
      return {
        replayKey: `${REPLAY_KEY_PREFIX}mercadopago-legacy:${paymentId}:${req.header("x-webhook-timestamp") ?? Date.now()}`,
      };
    }

    if (!isProduction) {
      this.logger.warn(CONTEXT, "Mercado Pago webhook accepted without signature (non-production)");
      const paymentId = extractMercadoPagoManifestId(req) ?? "unknown";
      return {
        replayKey: `${REPLAY_KEY_PREFIX}mercadopago-open:${paymentId}:${Date.now()}`,
      };
    }

    throw new WebhookUnauthorizedError("Unauthorized Mercado Pago webhook");
  }

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

  async authorize(req: Request): Promise<WebhookAuthResult> {
    if (isMercadoPagoWebhookRequest(req)) {
      return this.authorizeMercadoPago(req);
    }

    return this.authorizeInternal(req);
  }

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
