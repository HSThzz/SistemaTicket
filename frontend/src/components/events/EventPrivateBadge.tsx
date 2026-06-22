/**
 * @file Badge reutilizável para eventos privados.
 * @module components/events/EventPrivateBadge
 */

import { IconLock } from "@tabler/icons-react";
import { PremiumBadge } from "../ui/PremiumBadge";
import type { Event } from "../../types/api";

/** Indica se o evento usa fluxo privado com aprovação. */
export function isPrivateEvent(event: Pick<Event, "type">): boolean {
  return event.type === "PRIVATE";
}

const ICON_SIZES = {
  xs: 10,
  sm: 11,
  md: 12,
  lg: 13,
} as const;

/**
 * Badge compacto "Privado" para cards e listagens.
 */
export function EventPrivateBadge({
  size = "sm",
  overlay = false,
}: {
  size?: "xs" | "sm" | "md" | "lg";
  overlay?: boolean;
}) {
  const badgeSize = size === "lg" ? "md" : size === "md" ? "sm" : size;

  return (
    <PremiumBadge
      tone="private"
      size={badgeSize}
      overlay={overlay}
      icon={<IconLock size={ICON_SIZES[size]} stroke={2} />}
    >
      Privado
    </PremiumBadge>
  );
}
