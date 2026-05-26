import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Request } from "express";
import {
  extractMercadoPagoPaymentId,
  isMercadoPagoWebhookRequest,
} from "../../src/services/payment/mercadoPagoWebhook";

function mockRequest(partial: Partial<Request>): Request {
  return partial as Request;
}

describe("Mercado Pago webhook parser", () => {
  it("extracts payment id from JSON webhook body", () => {
    const req = mockRequest({
      body: {
        type: "payment",
        data: { id: "123456789" },
      },
      query: {},
    });

    assert.equal(extractMercadoPagoPaymentId(req), "123456789");
    assert.equal(isMercadoPagoWebhookRequest(req), true);
  });

  it("extracts payment id from IPN query params", () => {
    const req = mockRequest({
      body: {},
      query: {
        topic: "payment",
        id: "987654321",
      },
    });

    assert.equal(extractMercadoPagoPaymentId(req), "987654321");
  });

  it("returns null for unrelated payloads", () => {
    const req = mockRequest({
      body: { event: "payment.succeeded", data: { orderId: "abc" } },
      query: {},
    });

    assert.equal(extractMercadoPagoPaymentId(req), null);
    assert.equal(isMercadoPagoWebhookRequest(req), false);
  });
});
