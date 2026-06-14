import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import {
  isValidCpf,
  resolveMercadoPagoPayerIdentification,
} from "../../src/modules/payment/application/helpers/resolveMercadoPagoPayerDocument";
import { PaymentGatewayError } from "../../src/modules/payment/domain/errors/PaymentError";

describe("resolveMercadoPagoPayerIdentification", () => {
  const originalFallback = process.env.MERCADOPAGO_TEST_PAYER_DOCUMENT;
  const originalAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  afterEach(() => {
    if (originalFallback === undefined) {
      delete process.env.MERCADOPAGO_TEST_PAYER_DOCUMENT;
    } else {
      process.env.MERCADOPAGO_TEST_PAYER_DOCUMENT = originalFallback;
    }

    if (originalAccessToken === undefined) {
      delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    } else {
      process.env.MERCADOPAGO_ACCESS_TOKEN = originalAccessToken;
    }
  });

  it("accepts a valid CPF from the user", () => {
    assert.deepEqual(resolveMercadoPagoPayerIdentification("111.444.777-35"), {
      type: "CPF",
      number: "11144477735",
    });
  });

  it("rejects invalid seed CPF and uses sandbox fallback", () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-sandbox-token";
    delete process.env.MERCADOPAGO_TEST_PAYER_DOCUMENT;

    assert.equal(isValidCpf("10000000001"), false);
    assert.deepEqual(resolveMercadoPagoPayerIdentification("10000000001"), {
      type: "CPF",
      number: "11144477735",
    });
  });

  it("uses configured test payer document fallback", () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-sandbox-token";
    process.env.MERCADOPAGO_TEST_PAYER_DOCUMENT = "11144477735";

    assert.deepEqual(resolveMercadoPagoPayerIdentification("10000000001"), {
      type: "CPF",
      number: "11144477735",
    });
  });

  it("throws in production when document is invalid and no fallback applies", () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "APP_USR-production-token";
    delete process.env.MERCADOPAGO_TEST_PAYER_DOCUMENT;

    assert.throws(
      () => resolveMercadoPagoPayerIdentification("10000000001"),
      (error: unknown) =>
        error instanceof PaymentGatewayError &&
        error.code === "MERCADOPAGO_INVALID_PAYER_DOCUMENT",
    );
  });
});
