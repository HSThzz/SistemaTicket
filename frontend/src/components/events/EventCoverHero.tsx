/**
 * @file Hero com capa de evento via `<img>` (LCP) ou gradiente fallback.
 * @module components/EventCoverHero
 */

import { Box } from "@mantine/core";
import type { CSSProperties, ReactNode } from "react";
import type { EventCoverSource } from "@/modules/catalog/utils/eventVisuals";
import { getEventCoverImageUrl, getEventCoverStyle } from "@/modules/catalog/utils/eventVisuals";

interface EventCoverHeroProps {
  source: EventCoverSource;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** Marca a imagem como candidata a LCP (`fetchPriority="high"`). */
  priority?: boolean;
}

/**
 * Bloco hero com imagem posicionada ou gradiente quando não há `imageUrl`.
 */
export function EventCoverHero({
  source,
  className,
  style,
  children,
  priority = false,
}: EventCoverHeroProps) {
  const imageUrl = getEventCoverImageUrl(source);
  const fallbackStyle = imageUrl ? undefined : getEventCoverStyle(source);

  return (
    <Box className={className} style={{ ...fallbackStyle, ...style }}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="event-cover-media"
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
        />
      ) : null}
      {children}
    </Box>
  );
}
