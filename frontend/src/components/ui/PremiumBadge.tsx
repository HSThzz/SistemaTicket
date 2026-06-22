/**
 * @file Badge premium reutilizável com tons semânticos e variante overlay.
 * @module components/ui/PremiumBadge
 */

import type { ReactNode } from "react";
import { Box } from "@mantine/core";

/** Paleta semântica dos badges premium. */
export type PremiumBadgeTone =
  | "private"
  | "published"
  | "draft"
  | "cancelled"
  | "finished"
  | "warning"
  | "neutral"
  | "sold-out"
  | "glass"
  | "brand";

/** Propriedades do badge premium. */
export interface PremiumBadgeProps {
  children: ReactNode;
  tone?: PremiumBadgeTone;
  size?: "xs" | "sm" | "md";
  /** Estilo pensado para capas de evento e heroes com imagem. */
  overlay?: boolean;
  icon?: ReactNode;
  dot?: boolean;
  pulseDot?: boolean;
  className?: string;
}

/**
 * Badge compacto com visual glass/pill usado em status e tags de evento.
 */
export function PremiumBadge({
  children,
  tone = "neutral",
  size = "sm",
  overlay = false,
  icon,
  dot = false,
  pulseDot = false,
  className,
}: PremiumBadgeProps) {
  const classes = [
    "premium-badge",
    `premium-badge--${size}`,
    `premium-badge--${tone}`,
    overlay ? "premium-badge--overlay" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Box component="span" className={classes}>
      {dot ? (
        <span
          className={`premium-badge__dot${pulseDot ? " premium-badge__dot--pulse" : ""}`}
          aria-hidden
        />
      ) : null}
      {icon ? <span className="premium-badge__icon">{icon}</span> : null}
      {children}
    </Box>
  );
}
