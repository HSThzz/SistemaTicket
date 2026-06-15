import { env, isMercadoPagoSandbox } from "../../../../shared/infrastructure/config/env";
import { isValidCpf, sanitizeDocument } from "../../../../shared/kernel/cpf";
import { PaymentGatewayError } from "../../domain/errors/PaymentError";

export { isValidCpf, sanitizeDocument } from "../../../../shared/kernel/cpf";

/** CPF válido usado como fallback em sandbox quando o documento do usuário é inválido. */
const SANDBOX_DEFAULT_CPF = "11144477735";

export interface MercadoPagoPayerIdentification {
  type: "CPF" | "CNPJ";
  number: string;
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
