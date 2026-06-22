/**
 * @file Badge premium para estoque de lote (produtor).
 * @module components/ui/LotStockBadge
 */

import { PremiumBadge } from "./PremiumBadge";

interface LotStockBadgeProps {
  availableQuantity: number;
  lowStockThreshold?: number;
  size?: "xs" | "sm" | "md";
}

/** Badge de disponibilidade de lote conforme estoque restante. */
export function LotStockBadge({
  availableQuantity,
  lowStockThreshold = 10,
  size = "sm",
}: LotStockBadgeProps) {
  const soldOut = availableQuantity === 0;
  const lowStock = availableQuantity > 0 && availableQuantity <= lowStockThreshold;

  if (soldOut) {
    return (
      <PremiumBadge tone="sold-out" size={size}>
        Esgotado
      </PremiumBadge>
    );
  }

  if (lowStock) {
    return (
      <PremiumBadge tone="warning" size={size}>
        Acabando
      </PremiumBadge>
    );
  }

  return (
    <PremiumBadge tone="published" size={size} dot pulseDot>
      Disponível
    </PremiumBadge>
  );
}
