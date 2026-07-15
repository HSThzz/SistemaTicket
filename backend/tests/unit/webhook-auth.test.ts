import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import {
  buildMercadoPagoManifest,
  collectMercadoPagoManifestDataIds,
  isMercadoPagoLegacyIpnRequest,
  isTimestampWithinMaxAge,
  normalizeMercadoPagoTimestampMs,
  parseMercadoPagoSignatureHeader,
  verifyMercadoPagoSignature,
  verifyMercadoPagoSignatureForRequest,
} from "../../src/modules/payment/infrastructure/gateways/mercadoPagoSignature";
import {
  buildInternalWebhookSignature,
  verifyInternalWebhookSignature,
} from "../../src/modules/payment/infrastructure/gateways/internalWebhookSignature";

describe("Mercado Pago signature", () => {
  it("parses x-signature header", () => {
    const parsed = parseMercadoPagoSignatureHeader(
      "ts=1742505638683,v1=abc123def456",
    );

    assert.deepEqual(parsed, {
      ts: "1742505638683",
      v1: "abc123def456",
    });
  });

  it("validates HMAC manifest", () => {
    const secret = "test-webhook-secret";
    const manifest = buildMercadoPagoManifest({
      dataId: "123456",
      requestId: "req-1",
      ts: "1742505638683",
    });

    const invalid = verifyMercadoPagoSignature({
      manifest,
      secret,
      receivedSignature: "000",
    });

    assert.equal(invalid, false);

    const expected = createHmac("sha256", secret).update(manifest).digest("hex");

    assert.equal(
      verifyMercadoPagoSignature({
        manifest,
        secret,
        receivedSignature: expected,
      }),
      true,
    );
  });

  it("accepts MP ts header in Unix seconds (10 digits)", () => {
    const nowMs = 1_782_000_000_000;
    const tsSeconds = "1782000000";

    assert.equal(normalizeMercadoPagoTimestampMs(tsSeconds), 1_782_000_000_000);
    assert.equal(isTimestampWithinMaxAge(tsSeconds, 300, nowMs), true);
    assert.equal(isTimestampWithinMaxAge(tsSeconds, 300, nowMs + 400_000), false);
  });

  it("accepts MP ts header in milliseconds (13 digits)", () => {
    const nowMs = 1_742_505_638_683;

    assert.equal(isTimestampWithinMaxAge("1742505638683", 300, nowMs), true);
  });

  it("tries multiple manifest data ids for signature", () => {
    const secret = "test-webhook-secret";
    const requestId = "req-1";
    const ts = "1742505638683";
    const paymentId = "164310746890";

    const expected = createHmac("sha256", secret)
      .update(
        buildMercadoPagoManifest({
          dataId: paymentId,
          requestId,
          ts,
        }),
      )
      .digest("hex");

    const req = {
      query: { id: paymentId, topic: "payment" },
      body: {},
    } as unknown as import("express").Request;

    assert.equal(
      verifyMercadoPagoSignatureForRequest({
        req,
        requestId,
        ts,
        secret,
        receivedSignature: expected,
      }),
      true,
    );

    assert.ok(collectMercadoPagoManifestDataIds(req).includes(paymentId));
  });

  it("accepts manifest without id when MP omits data.id (IPN / refund notify)", () => {
    const secret = "test-webhook-secret";
    const requestId = "req-refund-1";
    const ts = "1742505638683";

    const expected = createHmac("sha256", secret)
      .update(
        buildMercadoPagoManifest({
          dataId: null,
          requestId,
          ts,
        }),
      )
      .digest("hex");

    const req = {
      query: { id: "999888777", topic: "payment" },
      body: {},
    } as unknown as import("express").Request;

    assert.equal(
      verifyMercadoPagoSignatureForRequest({
        req,
        requestId,
        ts,
        secret,
        receivedSignature: expected,
      }),
      true,
    );
  });

  it("detects legacy IPN query shape used after refunds", () => {
    assert.equal(
      isMercadoPagoLegacyIpnRequest({
        query: { id: "123", topic: "payment" },
        body: {},
      } as unknown as import("express").Request),
      true,
    );

    assert.equal(
      isMercadoPagoLegacyIpnRequest({
        query: { "data.id": "123", type: "payment" },
        body: {},
      } as unknown as import("express").Request),
      false,
    );
  });
});

describe("Internal webhook HMAC", () => {
  it("signs and verifies payload", () => {
    const secret = "test-webhook-secret";
    const timestamp = "1710000000000";
    const rawBody = JSON.stringify({
      event: "payment.succeeded",
      data: { orderId: "order-1", transactionId: "tx-1" },
    });

    const signature = buildInternalWebhookSignature({ secret, timestamp, rawBody });

    assert.equal(
      verifyInternalWebhookSignature({
        secret,
        timestamp,
        rawBody,
        receivedSignature: signature,
      }),
      true,
    );

    assert.equal(
      verifyInternalWebhookSignature({
        secret,
        timestamp,
        rawBody,
        receivedSignature: "deadbeef",
      }),
      false,
    );
  });
});
