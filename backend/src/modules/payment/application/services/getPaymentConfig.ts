import { env } from "../../../../shared/infrastructure/config/env";

/** Configuração pública de pagamento exposta ao front-end (checkout). */
export interface PaymentConfigView {
  /** Chave pública do Mercado Pago para tokenização de cartão no navegador. */
  mercadoPagoPublicKey: string | null;
  /** Indica se o gateway Mercado Pago está ativo no back-end. */
  mercadoPagoEnabled: boolean;
  /** Indica se pagamento com cartão pode ser oferecido no checkout. */
  cardPaymentEnabled: boolean;
}

/**
 * Retorna dados não sensíveis necessários para o checkout no front-end.
 * A public key do MP é segura para exposição (uso exclusivo no browser).
 */
export function getPaymentConfig(): PaymentConfigView {
  const publicKey = env.payment.mercadoPago.publicKey.trim();
  const mercadoPagoEnabled = env.payment.gateway === "mercadopago";

  return {
    mercadoPagoPublicKey: publicKey || null,
    mercadoPagoEnabled,
    cardPaymentEnabled: mercadoPagoEnabled && Boolean(publicKey),
  };
}
