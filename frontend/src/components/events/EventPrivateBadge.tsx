/**
 * @file Badge reutilizável para eventos privados.
 * @module components/events/EventPrivateBadge
 */

import { Badge } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";
import type { Event } from "../../types/api";

/** Indica se o evento usa fluxo privado com aprovação. */
export function isPrivateEvent(event: Pick<Event, "type">): boolean {
  return event.type === "PRIVATE";
}

/**
 * Badge compacto "Privado" para cards e listagens.
 */
export function EventPrivateBadge({
  size = "sm",
  variant = "filled",
}: {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "filled" | "light";
}) {
  const iconSize = size === "xs" ? 10 : 12;

  return (
    <Badge
      color="grape"
      variant={variant}
      radius="sm"
      size={size}
      leftSection={<IconLock size={iconSize} />}
    >
      Privado
    </Badge>
  );
}
