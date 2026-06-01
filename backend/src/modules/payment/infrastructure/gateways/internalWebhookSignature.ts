/**
 * @file Assinatura HMAC para webhooks internos (gateway simulado / integrações próprias).
 * @module payment/infrastructure/gateways/internalWebhookSignature
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";

/**
 * @param params - Secret, timestamp e corpo bruto da requisição.
 * @returns Assinatura HMAC-SHA256 em hexadecimal.
 */
export function buildInternalWebhookSignature(params: {
  secret: string;
  timestamp: string;
  rawBody: string;
}): string {
  return createHmac("sha256", params.secret)
    .update(`${params.timestamp}.${params.rawBody}`)
    .digest("hex");
}

/**
 * @param params - Secret, timestamp, corpo e assinatura recebida.
 * @returns `true` se a assinatura calculada coincidir.
 */
export function verifyInternalWebhookSignature(params: {
  secret: string;
  timestamp: string;
  rawBody: string;
  receivedSignature: string;
}): boolean {
  const calculated = buildInternalWebhookSignature({
    secret: params.secret,
    timestamp: params.timestamp,
    rawBody: params.rawBody,
  });

  return safeEqualHex(calculated, params.receivedSignature);
}

/**
 * @param timestamp - Timestamp em ms (string).
 * @param maxAgeSeconds - Idade máxima permitida.
 * @param nowMs - Referência temporal.
 * @returns `false` se futuro (>1 min à frente) ou expirado.
 */
export function isInternalTimestampValid(
  timestamp: string,
  maxAgeSeconds: number,
  nowMs = Date.now(),
): boolean {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) {
    return false;
  }

  if (ts > nowMs + 60_000) {
    return false;
  }

  return nowMs - ts <= maxAgeSeconds * 1000;
}

/**
 * @param req - Requisição com `rawBody` (middleware JSON) ou body parseado.
 * @returns Corpo exato usado na verificação HMAC.
 */
export function getInternalWebhookRawBody(req: Request): string {
  if (req.rawBody && req.rawBody.length > 0) {
    return req.rawBody.toString("utf8");
  }

  return JSON.stringify(req.body ?? {});
}

function safeEqualHex(left: string, right: string): boolean {
  try {
    const leftBuffer = Buffer.from(left, "hex");
    const rightBuffer = Buffer.from(right, "hex");

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  } catch {
    return false;
  }
}
