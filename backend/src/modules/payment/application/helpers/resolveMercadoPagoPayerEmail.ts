import { env } from "../../../../shared/infrastructure/config/env";
import { PaymentGatewayError } from "../../domain/errors/PaymentError";

const MERCADO_PAGO_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** TLDs reservados que a API do Mercado Pago costuma rejeitar. */
const BLOCKED_EMAIL_TLDS = new Set(["test", "localhost", "invalid"]);

/**
 * Normaliza e-mail para envio a gateways de pagamento.
 */
export function normalizePayerEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Verifica se o e-mail tem formato aceito pelo Mercado Pago.
 */
export function isMercadoPagoAcceptableEmail(email: string): boolean {
  const normalized = normalizePayerEmail(email);
  if (!MERCADO_PAGO_EMAIL_PATTERN.test(normalized)) {
    return false;
  }

  const domain = normalized.split("@")[1] ?? "";
  const tld = domain.split(".").pop() ?? "";
  return !BLOCKED_EMAIL_TLDS.has(tld);
}

/**
 * Resolve o e-mail do pagador para cobrança PIX no Mercado Pago.
 * Usa fallback de sandbox quando o e-mail do usuário não é aceito pela API.
 *
 * @throws {PaymentGatewayError} Quando não há e-mail válido disponível.
 */
export function resolveMercadoPagoPayerEmail(userEmail: string): string {
  const normalized = normalizePayerEmail(userEmail);

  if (isMercadoPagoAcceptableEmail(normalized)) {
    return normalized;
  }

  const fallback = (
    process.env.MERCADOPAGO_TEST_PAYER_EMAIL ??
    env.payment.mercadoPago.testPayerEmail
  )
    .trim()
    .toLowerCase();
  if (fallback && isMercadoPagoAcceptableEmail(fallback)) {
    return fallback;
  }

  throw new PaymentGatewayError(
    "E-mail do pagador inválido para Mercado Pago. Cadastre um e-mail real (ex.: Gmail) ou configure MERCADOPAGO_TEST_PAYER_EMAIL com o e-mail de teste do painel MP.",
    "MERCADOPAGO_INVALID_PAYER_EMAIL",
  );
}
