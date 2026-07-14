/**
 * @file Cálculo da taxa de serviço da plataforma sobre o subtotal do pedido.
 * @module shared/kernel/platformFee
 */

/** Percentual padrão da taxa (8%). Sobrescrevível via `PLATFORM_FEE_PERCENT`. */
export const DEFAULT_PLATFORM_FEE_PERCENT = 8;

/**
 * Taxa em centavos a partir do subtotal dos ingressos.
 * Ingresso gratuito (0) não gera taxa.
 */
export function calculatePlatformFeeCents(
  subtotalCents: number,
  feePercent: number = DEFAULT_PLATFORM_FEE_PERCENT,
): number {
  if (subtotalCents <= 0 || feePercent <= 0) {
    return 0;
  }

  return Math.round((subtotalCents * feePercent) / 100);
}

/** Total cobrado do comprador: subtotal + taxa. */
export function calculateOrderTotalWithPlatformFee(
  subtotalCents: number,
  feePercent: number = DEFAULT_PLATFORM_FEE_PERCENT,
): { subtotalCents: number; platformFeeCents: number; totalCents: number } {
  const platformFeeCents = calculatePlatformFeeCents(subtotalCents, feePercent);
  return {
    subtotalCents,
    platformFeeCents,
    totalCents: subtotalCents + platformFeeCents,
  };
}
