/**
 * @file Badge premium para status de solicitação de participação.
 * @module components/ui/ParticipationStatusBadge
 */

import { PremiumBadge, type PremiumBadgeTone } from "./PremiumBadge";
import { getParticipationStatusLabel } from "../../utils/statusLabels";

/** Mapeia status de participação para tom visual do badge. */
export function getParticipationStatusTone(status: string): PremiumBadgeTone {
  switch (status) {
    case "PENDING":
      return "warning";
    case "APPROVED":
      return "published";
    case "REJECTED":
      return "cancelled";
    default:
      return "neutral";
  }
}

interface ParticipationStatusBadgeProps {
  status: string;
  size?: "xs" | "sm" | "md";
}

/** Badge de status de solicitação em eventos privados. */
export function ParticipationStatusBadge({ status, size = "xs" }: ParticipationStatusBadgeProps) {
  const isApproved = status === "APPROVED";

  return (
    <PremiumBadge
      tone={getParticipationStatusTone(status)}
      size={size}
      dot={isApproved}
      pulseDot={isApproved}
    >
      {getParticipationStatusLabel(status)}
    </PremiumBadge>
  );
}
