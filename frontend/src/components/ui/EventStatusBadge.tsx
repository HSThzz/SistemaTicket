/**
 * @file Badge premium para status de evento (Publicado, Rascunho, etc.).
 * @module components/ui/EventStatusBadge
 */

import { PremiumBadge, type PremiumBadgeTone } from "./PremiumBadge";
import { getEventStatusLabel } from "../../utils/statusLabels";

/** Mapeia status de evento para tom visual do badge. */
export function getEventStatusTone(status: string): PremiumBadgeTone {
  switch (status) {
    case "DRAFT":
      return "draft";
    case "PUBLISHED":
      return "published";
    case "CANCELLED":
      return "cancelled";
    case "FINISHED":
      return "finished";
    default:
      return "neutral";
  }
}

interface EventStatusBadgeProps {
  status: string;
  size?: "xs" | "sm" | "md";
  overlay?: boolean;
}

/** Badge de status de evento com ponto pulsante quando publicado. */
export function EventStatusBadge({ status, size = "sm", overlay = false }: EventStatusBadgeProps) {
  const isPublished = status === "PUBLISHED";

  return (
    <PremiumBadge
      tone={getEventStatusTone(status)}
      size={size}
      overlay={overlay}
      dot={isPublished}
      pulseDot={isPublished}
    >
      {getEventStatusLabel(status)}
    </PremiumBadge>
  );
}
