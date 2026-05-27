import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import {
  buildMercadoPagoManifest,
  parseMercadoPagoSignatureHeader,
  verifyMercadoPagoSignature,
} from "../../src/services/payment/mercadoPagoSignature";
import {
  buildInternalWebhookSignature,
  verifyInternalWebhookSignature,
} from "../../src/services/payment/internalWebhookSignature";

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
