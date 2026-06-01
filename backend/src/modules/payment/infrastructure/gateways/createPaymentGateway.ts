/**
 * @file Factory do gateway de pagamento conforme variável de ambiente.
 * @module payment/infrastructure/gateways/createPaymentGateway
 */

import type { PaymentGateway } from "./PaymentGateway";
import { createMercadoPagoPixGatewayFromEnv } from "./MercadoPagoPixGateway";
import { SimulatedPixGateway } from "./SimulatedPixGateway";

/**
 * Provedor de pagamento suportado pela aplicação.
 */
export type PaymentGatewayProvider = "simulated" | "mercadopago";

/**
 * Instancia o gateway PIX configurado em `PAYMENT_GATEWAY`.
 * @returns Implementação simulada ou Mercado Pago.
 * @throws {Error} Se Mercado Pago estiver selecionado sem token (via factory do MP).
 */
export function createPaymentGateway(): PaymentGateway {
  const provider = (process.env.PAYMENT_GATEWAY ?? "simulated") as PaymentGatewayProvider;

  if (provider === "mercadopago") {
    return createMercadoPagoPixGatewayFromEnv();
  }

  return new SimulatedPixGateway();
}

/**
 * Lê o provedor ativo sem instanciar o gateway.
 * @returns `"mercadopago"` ou `"simulated"`.
 */
export function getPaymentGatewayProvider(): PaymentGatewayProvider {
  const provider = process.env.PAYMENT_GATEWAY ?? "simulated";
  if (provider === "mercadopago") {
    return "mercadopago";
  }
  return "simulated";
}

export { MercadoPagoPixGateway, isMercadoPagoPixGateway } from "./MercadoPagoPixGateway";
