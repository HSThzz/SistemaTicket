import { env, isMercadoPagoSandbox } from "../../../../shared/infrastructure/config/env";
import { PaymentGatewayError } from "../../domain/errors/PaymentError";

/** CPF válido usado como fallback em sandbox quando o documento do usuário é inválido. */
const SANDBOX_DEFAULT_CPF = "11144477735";

export interface MercadoPagoPayerIdentification {
  type: "CPF" | "CNPJ";
  number: string;
}

/** Remove caracteres não numéricos de CPF/CNPJ. */
export function sanitizeDocument(document: string): string {
  return document.replace(/\D/g, "");
}

/** Valida dígitos verificadores de um CPF brasileiro. */
export function isValidCpf(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(cpf[index]) * (10 - index);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }
  if (remainder !== Number(cpf[9])) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(cpf[index]) * (11 - index);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  return remainder === Number(cpf[10]);
}

/**
 * Resolve CPF/CNPJ do pagador para a API do Mercado Pago.
 * Em sandbox, usa fallback configurável quando o documento do usuário é inválido
 * (comum em contas de seed como `10000000001`).
 *
 * @throws {PaymentGatewayError} Quando não há documento válido disponível.
 */
export function resolveMercadoPagoPayerIdentification(
  userDocument: string,
): MercadoPagoPayerIdentification {
  const sanitized = sanitizeDocument(userDocument);

  if (sanitized.length === 11 && isValidCpf(sanitized)) {
    return { type: "CPF", number: sanitized };
  }

  const fallbackRaw = (
    process.env.MERCADOPAGO_TEST_PAYER_DOCUMENT ??
    env.payment.mercadoPago.testPayerDocument
  ).trim();
  const fallback = sanitizeDocument(fallbackRaw);

  if (fallback.length === 11 && isValidCpf(fallback)) {
    return { type: "CPF", number: fallback };
  }

  if (isMercadoPagoSandbox()) {
    return { type: "CPF", number: SANDBOX_DEFAULT_CPF };
  }

  throw new PaymentGatewayError(
    "CPF/CNPJ do pagador inválido para Mercado Pago. Atualize o documento do usuário ou configure MERCADOPAGO_TEST_PAYER_DOCUMENT.",
    "MERCADOPAGO_INVALID_PAYER_DOCUMENT",
  );
}
