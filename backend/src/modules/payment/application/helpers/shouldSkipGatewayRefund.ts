/**
 * @file Decide se o reembolso deve pular a chamada ao gateway de pagamento.
 * @module modules/payment/application/helpers/shouldSkipGatewayRefund
 */

/** Prefixo de `paymentGatewayId` para emissões manuais/cortesia. */
export const MANUAL_PAYMENT_GATEWAY_PREFIX = "manual:";

/**
 * Ingressos manuais, pedidos sem ID de gateway, ou reembolsos já feitos no MP
 * (webhook) não devem chamar `refundPayment` no provedor.
 */
export function shouldSkipGatewayRefund(
  paymentGatewayId: string | null | undefined,
  options?: { skipGatewayRefund?: boolean },
): boolean {
  if (options?.skipGatewayRefund) {
    return true;
  }

  if (!paymentGatewayId) {
    return true;
  }

  return paymentGatewayId.startsWith(MANUAL_PAYMENT_GATEWAY_PREFIX);
}
