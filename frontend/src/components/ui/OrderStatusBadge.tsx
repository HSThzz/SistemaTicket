/**
 * @file Badge premium para status de pedido.
 * @module components/ui/OrderStatusBadge
 */

import { PremiumBadge, type PremiumBadgeTone } from "./PremiumBadge";
import { getOrderStatusLabel } from "@/shared/utils/statusLabels";

/** Mapeia status de pedido para tom visual do badge. */
export function getOrderStatusTone(status: string): PremiumBadgeTone {
  switch (status) {
    case "PENDING":
      return "warning";
    case "PAID":
      return "published";
    case "FAILED":
      return "cancelled";
    case "REFUNDED":
      return "finished";
    default:
      return "neutral";
  }
}

interface OrderStatusBadgeProps {
  status: string;
  size?: "xs" | "sm" | "md";
}

/** Badge de status de pedido na área do cliente. */
export function OrderStatusBadge({ status, size = "sm" }: OrderStatusBadgeProps) {
  const isPaid = status === "PAID";

  return (
    <PremiumBadge
      tone={getOrderStatusTone(status)}
      size={size}
      dot={isPaid}
      pulseDot={isPaid}
    >
      {getOrderStatusLabel(status)}
    </PremiumBadge>
  );
}
