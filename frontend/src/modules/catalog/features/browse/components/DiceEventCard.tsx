import { Link } from "react-router-dom";
import { Box, Stack, Text, UnstyledButton } from "@mantine/core";
import { EventFavoriteButton } from "@/components/ui/EventFavoriteButton";
import { ParticipationStatusBadge } from "@/components/ui/ParticipationStatusBadge";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import { EventPrivateBadge, isPrivateEvent } from "./EventPrivateBadge";
import { useEventFavoriteAction } from "@/modules/identity/features/profile/hooks/useEventFavoriteAction";
import { useParticipation } from "@/modules/participation/features/requests/hooks/useParticipation";
import type { Event } from "@/shared/types/api";
import { eventPath } from "@/modules/catalog/utils/eventPaths";
import {
  extractCity,
  getEventCoverStyle,
  getLowestPrice,
  getTotalAvailable,
} from "@/modules/catalog/utils/eventVisuals";
import { formatCurrencyFromCents, formatEventDateDice } from "@/shared/utils/format";

interface DiceEventCardProps {
  event: Event;
}

export function DiceEventCard({ event }: DiceEventCardProps) {
  const { liked, handleToggleFavorite } = useEventFavoriteAction({ eventId: event.id });
  const { getParticipationStatus } = useParticipation();
  const participationStatus = isPrivateEvent(event)
    ? getParticipationStatus(event.id)
    : null;
  const lowestPrice = getLowestPrice(event);
  const totalAvailable = getTotalAvailable(event);
  const soldOut = totalAvailable === 0;
  const venue = extractCity(event.location);
  const href = eventPath(event);

  return (
    <Box className="dice-event-card">
      <UnstyledButton
        component={Link}
        to={href}
        className="dice-event-card__link"
      >
        <Box className="dice-event-card__cover" style={getEventCoverStyle(event)}>
          {isPrivateEvent(event) || soldOut || participationStatus ? (
            <Box className="dice-event-card__badges">
              {isPrivateEvent(event) ? <EventPrivateBadge size="xs" overlay /> : null}
              {participationStatus ? (
                <ParticipationStatusBadge status={participationStatus} size="xs" overlay />
              ) : null}
              {soldOut ? (
                <PremiumBadge tone="sold-out" size="xs" overlay>
                  Esgotado
                </PremiumBadge>
              ) : null}
            </Box>
          ) : null}
          <EventFavoriteButton
            liked={liked}
            variant="card"
            size="lg"
            onClick={(clickEvent) => void handleToggleFavorite(clickEvent)}
          />
        </Box>
      </UnstyledButton>

      <Stack gap={4} className="dice-event-card__body">
        <Text
          component={Link}
          to={href}
          className="dice-event-card__title"
          lineClamp={2}
        >
          {event.title}
        </Text>
        <Text className="dice-event-card__date">{formatEventDateDice(event.date)}</Text>
        <Text className="dice-event-card__venue" lineClamp={1}>
          {venue}
        </Text>
        <Text className="dice-event-card__price">
          {soldOut
            ? "Indisponível"
            : lowestPrice !== null && lowestPrice === 0
              ? "Gratuito"
              : lowestPrice !== null
                ? `A partir de ${formatCurrencyFromCents(lowestPrice)}`
                : "Em breve"}
        </Text>
      </Stack>
    </Box>
  );
}
