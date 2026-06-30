/**
 * @file Badge premium para status de ingresso.
 * @module components/ui/TicketStatusBadge
 */

import { PremiumBadge, type PremiumBadgeTone } from "./PremiumBadge";
import { getTicketStatusLabel } from "@/shared/utils/statusLabels";

/** Mapeia status de ingresso para tom visual do badge. */
export function getTicketStatusTone(status: string): PremiumBadgeTone {
  switch (status) {
    case "ACTIVE":
      return "published";
    case "USED":
      return "finished";
    case "CANCELLED":
      return "cancelled";
    default:
      return "neutral";
  }
}

interface TicketStatusBadgeProps {
  status: string;
  size?: "xs" | "sm" | "md";
  overlay?: boolean;
  className?: string;
}

/** Badge de status de ingresso na carteira digital. */
export function TicketStatusBadge({
  status,
  size = "xs",
  overlay = false,
  className,
}: TicketStatusBadgeProps) {
  const isActive = status === "ACTIVE";

  return (
    <PremiumBadge
      tone={getTicketStatusTone(status)}
      size={size}
      overlay={overlay}
      dot={isActive}
      pulseDot={isActive}
      className={className}
    >
      {getTicketStatusLabel(status)}
    </PremiumBadge>
  );
}
