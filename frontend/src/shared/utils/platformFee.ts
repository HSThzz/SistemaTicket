/**
 * @file Taxa de serviço da plataforma (espelha o backend).
 * @module shared/utils/platformFee
 */

/** Percentual padrão — manter alinhado a `PLATFORM_FEE_PERCENT` do backend. */
export const PLATFORM_FEE_PERCENT = 10;

export function calculatePlatformFeeCents(
  subtotalCents: number,
  feePercent: number = PLATFORM_FEE_PERCENT,
): number {
  if (subtotalCents <= 0 || feePercent <= 0) {
    return 0;
  }

  return Math.round((subtotalCents * feePercent) / 100);
}

export function calculateOrderTotalWithPlatformFee(
  subtotalCents: number,
  feePercent: number = PLATFORM_FEE_PERCENT,
): { subtotalCents: number; platformFeeCents: number; totalCents: number } {
  const platformFeeCents = calculatePlatformFeeCents(subtotalCents, feePercent);
  return {
    subtotalCents,
    platformFeeCents,
    totalCents: subtotalCents + platformFeeCents,
  };
}
