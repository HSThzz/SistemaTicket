import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import {
  isMercadoPagoAcceptableEmail,
  normalizePayerEmail,
  resolveMercadoPagoPayerEmail,
} from "../../src/modules/payment/application/helpers/resolveMercadoPagoPayerEmail";
import { PaymentGatewayError } from "../../src/modules/payment/domain/errors/PaymentError";

describe("resolveMercadoPagoPayerEmail", () => {
  const originalFallback = process.env.MERCADOPAGO_TEST_PAYER_EMAIL;

  afterEach(() => {
    if (originalFallback === undefined) {
      delete process.env.MERCADOPAGO_TEST_PAYER_EMAIL;
    } else {
      process.env.MERCADOPAGO_TEST_PAYER_EMAIL = originalFallback;
    }
  });

  it("normalizes payer email", () => {
    assert.equal(normalizePayerEmail("  User@Gmail.COM  "), "user@gmail.com");
  });

  it("accepts common real-world emails", () => {
    assert.equal(isMercadoPagoAcceptableEmail("user@gmail.com"), true);
    assert.equal(isMercadoPagoAcceptableEmail("client@vibraevents.com.br"), true);
  });

  it("rejects reserved .test emails used in seed accounts", () => {
    assert.equal(isMercadoPagoAcceptableEmail("client@ticketflow.test"), false);
  });

  it("uses Mercado Pago test payer fallback for invalid user emails", () => {
    process.env.MERCADOPAGO_TEST_PAYER_EMAIL = "test_user_123456789@testuser.com";

    assert.equal(
      resolveMercadoPagoPayerEmail("client@ticketflow.test"),
      "test_user_123456789@testuser.com",
    );
  });

  it("throws when email is invalid and fallback is missing", () => {
    delete process.env.MERCADOPAGO_TEST_PAYER_EMAIL;

    assert.throws(
      () => resolveMercadoPagoPayerEmail("client@ticketflow.test"),
      (error: unknown) =>
        error instanceof PaymentGatewayError &&
        error.code === "MERCADOPAGO_INVALID_PAYER_EMAIL",
    );
  });
});
