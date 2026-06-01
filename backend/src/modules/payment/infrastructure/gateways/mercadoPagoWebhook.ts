import type { Request } from "express";

export function extractMercadoPagoPaymentId(req: Request): string | null {
  const body = req.body as {
    type?: string;
    action?: string;
    data?: { id?: string | number };
  };

  if (body?.data?.id !== undefined) {
    const type = body.type ?? body.action ?? "";
    if (type.includes("payment")) {
      return String(body.data.id);
    }
  }

  const topic = readQueryValue(req.query.topic);
  const id = readQueryValue(req.query.id);

  if (topic === "payment" && id) {
    return id;
  }

  const dataId = readQueryValue(req.query["data.id"]);
  if (dataId) {
    return dataId;
  }

  return null;
}

export function isMercadoPagoWebhookRequest(req: Request): boolean {
  return extractMercadoPagoPaymentId(req) !== null;
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
