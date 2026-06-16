/**
 * @file Validação de assinatura HMAC dos webhooks Mercado Pago.
 * @module payment/infrastructure/gateways/mercadoPagoSignature
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";

/**
 * Componentes parseados do header `x-signature`.
 */
export interface ParsedMercadoPagoSignature {
  ts: string;
  v1: string;
}

/**
 * @param headerValue - Valor bruto de `x-signature` (`ts=...,v1=...`).
 * @returns Timestamp e assinatura ou `null` se malformado.
 */
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

/**
 * @param req - Requisição com query `data.id` / `id` ou body `data.id`.
 * @returns ID normalizado para o manifest de assinatura.
 */
export function extractMercadoPagoManifestId(req: Request): string | null {
  const fromQuery = readMercadoPagoDataIdFromQuery(req.query);

  if (fromQuery) {
    return normalizeMercadoPagoDataId(fromQuery);
  }

  const body = req.body as { data?: { id?: string | number } };
  if (body?.data?.id !== undefined) {
    return normalizeMercadoPagoDataId(String(body.data.id));
  }

  return null;
}

/**
 * Monta a string assinada conforme documentação do Mercado Pago.
 * @param params - `dataId`, `requestId` e `ts` do webhook.
 * @returns Manifest no formato `id:...;request-id:...;ts:...;`.
 */
export function buildMercadoPagoManifest(params: {
  dataId: string;
  requestId: string;
  ts: string;
}): string {
  return `id:${params.dataId};request-id:${params.requestId};ts:${params.ts};`;
}

/**
 * @param params - Manifest, secret e assinatura recebida em hex.
 * @returns `true` se o HMAC SHA-256 coincidir (comparação timing-safe).
 */
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

/**
 * Normaliza o `ts` do header x-signature para milissegundos.
 * O MP documenta "milissegundos", mas na prática envia Unix em segundos (10 dígitos).
 */
export function normalizeMercadoPagoTimestampMs(raw: string): number | null {
  const ts = Number(raw);
  if (!Number.isFinite(ts)) {
    return null;
  }

  if (ts < 1_000_000_000_000) {
    return ts * 1000;
  }

  return ts;
}

/**
 * @param timestamp - Timestamp do header (`ts`), em segundos ou milissegundos.
 * @param maxAgeSeconds - Janela máxima aceita.
 * @param nowMs - Referência temporal (padrão: agora).
 * @returns `true` se a idade absoluta estiver dentro do limite.
 */
export function isTimestampWithinMaxAge(
  timestamp: string,
  maxAgeSeconds: number,
  nowMs = Date.now(),
): boolean {
  const tsMs = normalizeMercadoPagoTimestampMs(timestamp);
  if (tsMs === null) {
    return false;
  }

  const ageMs = Math.abs(nowMs - tsMs);
  return ageMs <= maxAgeSeconds * 1000;
}

function normalizeMercadoPagoDataId(value: string): string {
  if (/^[a-zA-Z0-9]+$/.test(value)) {
    return value.toLowerCase();
  }

  return value;
}

function readMercadoPagoDataIdFromQuery(query: Request["query"]): string | null {
  const dotted = readQueryValue(query["data.id"]);
  if (dotted) {
    return dotted;
  }

  const nested = query.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const nestedId = readQueryValue((nested as { id?: unknown }).id);
    if (nestedId) {
      return nestedId;
    }
  }

  return readQueryValue(query.id) ?? readQueryValue(query.data_id);
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
