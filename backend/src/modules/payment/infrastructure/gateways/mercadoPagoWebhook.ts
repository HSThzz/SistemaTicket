/**
 * @file Utilitários para identificar webhooks e extrair ID de pagamento do Mercado Pago.
 * @module payment/infrastructure/gateways/mercadoPagoWebhook
 */

import type { Request } from "express";

/** ID fixo usado pelo botão "testar URL" no painel do Mercado Pago. */
export const MERCADO_PAGO_PANEL_TEST_PAYMENT_ID = "123456";

/**
 * Extrai o ID do pagamento do body ou query string do webhook MP.
 * @param req - Requisição HTTP do webhook.
 * @returns ID do pagamento ou `null` se o payload não for de pagamento.
 */
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

/**
 * Indica se a requisição parece ser notificação Mercado Pago (possui payment id).
 * @param req - Requisição HTTP.
 * @returns `true` quando {@link extractMercadoPagoPaymentId} retorna valor.
 */
export function isMercadoPagoWebhookRequest(req: Request): boolean {
  return extractMercadoPagoPaymentId(req) !== null;
}

/**
 * Detecta a simulação de webhook do painel Mercado Pago (sempre `data.id = 123456`).
 */
export function isMercadoPagoPanelTestRequest(req: Request): boolean {
  const paymentId = extractMercadoPagoPaymentId(req);
  return paymentId === MERCADO_PAGO_PANEL_TEST_PAYMENT_ID;
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
