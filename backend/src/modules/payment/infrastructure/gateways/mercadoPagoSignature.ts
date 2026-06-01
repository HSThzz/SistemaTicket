import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";

export interface ParsedMercadoPagoSignature {
  ts: string;
  v1: string;
}

export function parseMercadoPagoSignatureHeader(
  headerValue: string | undefined,
): ParsedMercadoPagoSignature | null {
  if (!headerValue) {
    return null;
  }

  const parts = headerValue.split(",").map((part) => part.trim());
  let ts: string | null = null;
  let v1: string | null = null;

  for (const part of parts) {
    const [key, value] = part.split("=", 2);
    if (!key || !value) {
      continue;
    }

    if (key.trim() === "ts") {
      ts = value.trim();
    }

    if (key.trim() === "v1") {
      v1 = value.trim();
    }
  }

  if (!ts || !v1) {
    return null;
  }

  return { ts, v1 };
}

export function extractMercadoPagoManifestId(req: Request): string | null {
  const fromQuery =
    readQueryValue(req.query["data.id"]) ??
    readQueryValue(req.query.id) ??
    readQueryValue(req.query.data_id);

  if (fromQuery) {
    return normalizeMercadoPagoDataId(fromQuery);
  }

  const body = req.body as { data?: { id?: string | number } };
  if (body?.data?.id !== undefined) {
    return normalizeMercadoPagoDataId(String(body.data.id));
  }

  return null;
}

export function buildMercadoPagoManifest(params: {
  dataId: string;
  requestId: string;
  ts: string;
}): string {
  return `id:${params.dataId};request-id:${params.requestId};ts:${params.ts};`;
}

export function verifyMercadoPagoSignature(params: {
  manifest: string;
  secret: string;
  receivedSignature: string;
}): boolean {
  const calculated = createHmac("sha256", params.secret)
    .update(params.manifest)
    .digest("hex");

  return safeEqualHex(calculated, params.receivedSignature);
}

export function isTimestampWithinMaxAge(
  timestampMs: string,
  maxAgeSeconds: number,
  nowMs = Date.now(),
): boolean {
  const ts = Number(timestampMs);
  if (!Number.isFinite(ts)) {
    return false;
  }

  const ageMs = Math.abs(nowMs - ts);
  return ageMs <= maxAgeSeconds * 1000;
}

function normalizeMercadoPagoDataId(value: string): string {
  if (/^[a-zA-Z0-9]+$/.test(value)) {
    return value.toLowerCase();
  }

  return value;
}

function readQueryValue(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string" && value[0].length > 0) {
    return value[0];
  }

  return null;
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
