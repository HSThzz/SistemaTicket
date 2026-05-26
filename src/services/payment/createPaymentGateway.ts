import type { PaymentGateway } from "./PaymentGateway";
import { createMercadoPagoPixGatewayFromEnv } from "./MercadoPagoPixGateway";
import { SimulatedPixGateway } from "./SimulatedPixGateway";

export type PaymentGatewayProvider = "simulated" | "mercadopago";

export function createPaymentGateway(): PaymentGateway {
  const provider = (process.env.PAYMENT_GATEWAY ?? "simulated") as PaymentGatewayProvider;

  if (provider === "mercadopago") {
    return createMercadoPagoPixGatewayFromEnv();
  }

  return new SimulatedPixGateway();
}

export function getPaymentGatewayProvider(): PaymentGatewayProvider {
  const provider = process.env.PAYMENT_GATEWAY ?? "simulated";
  if (provider === "mercadopago") {
    return "mercadopago";
  }
  return "simulated";
}

export { MercadoPagoPixGateway, isMercadoPagoPixGateway } from "./MercadoPagoPixGateway";
