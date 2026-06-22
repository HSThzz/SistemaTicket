/**
 * @file Botão premium de favoritar evento.
 * @module components/ui/EventFavoriteButton
 */

import type { MouseEvent } from "react";
import { UnstyledButton } from "@mantine/core";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";

interface EventFavoriteButtonProps {
  liked: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  variant?: "hero" | "card" | "surface";
  size?: "md" | "lg" | "xl";
  className?: string;
  "aria-label"?: string;
}

const ICON_SIZES = {
  md: 16,
  lg: 18,
  xl: 20,
} as const;

/**
 * Controle circular de favorito com glassmorphism e destaque quando salvo.
 */
export function EventFavoriteButton({
  liked,
  onClick,
  variant = "hero",
  size = "xl",
  className,
  "aria-label": ariaLabel = liked ? "Remover dos favoritos" : "Salvar evento",
}: EventFavoriteButtonProps) {
  const classes = [
    "event-favorite-btn",
    `event-favorite-btn--${size}`,
    variant !== "hero" ? `event-favorite-btn--${variant}` : "",
    liked ? "is-liked" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <UnstyledButton
      type="button"
      className={classes}
      aria-label={ariaLabel}
      aria-pressed={liked}
      onClick={onClick}
    >
      {liked ? (
        <IconHeartFilled size={ICON_SIZES[size]} stroke={1.8} />
      ) : (
        <IconHeart size={ICON_SIZES[size]} stroke={1.8} />
      )}
    </UnstyledButton>
  );
}
