import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";

export function buildInternalWebhookSignature(params: {
  secret: string;
  timestamp: string;
  rawBody: string;
}): string {
  return createHmac("sha256", params.secret)
    .update(`${params.timestamp}.${params.rawBody}`)
    .digest("hex");
}

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
