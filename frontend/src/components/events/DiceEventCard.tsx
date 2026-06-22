import { Link } from "react-router-dom";
import { ActionIcon, Box, Stack, Text, UnstyledButton } from "@mantine/core";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";
import { isPrivateEvent } from "./EventPrivateBadge";
import { useEventFavoriteAction } from "../../hooks/useEventFavoriteAction";
import type { Event } from "../../types/api";
import {
  extractCity,
  getEventCoverStyle,
  getLowestPrice,
  getTotalAvailable,
} from "../../utils/eventVisuals";
import { formatCurrencyFromCents, formatEventDateDice } from "../../utils/format";

interface DiceEventCardProps {
  event: Event;
}

export function DiceEventCard({ event }: DiceEventCardProps) {
  const { liked, handleToggleFavorite } = useEventFavoriteAction({ eventId: event.id });
  const lowestPrice = getLowestPrice(event);
  const totalAvailable = getTotalAvailable(event);
  const soldOut = totalAvailable === 0;
  const venue = extractCity(event.location);

  return (
    <Box className="dice-event-card">
      <UnstyledButton
        component={Link}
        to={`/eventos/${event.id}`}
        className="dice-event-card__link"
      >
        <Box className="dice-event-card__cover" style={getEventCoverStyle(event)}>
          {isPrivateEvent(event) || soldOut ? (
            <Box className="dice-event-card__badges">
              {isPrivateEvent(event) ? (
                <span className="dice-event-card__badge dice-event-card__badge--private">
                  Privado
                </span>
              ) : null}
              {soldOut ? <span className="dice-event-card__badge">Esgotado</span> : null}
            </Box>
          ) : null}
          <ActionIcon
            className="dice-event-card__heart"
            variant="filled"
            radius="xl"
            size="lg"
            aria-label={liked ? "Remover dos favoritos" : "Salvar evento"}
            aria-pressed={liked}
            onClick={handleToggleFavorite}
          >
            {liked ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
          </ActionIcon>
        </Box>
      </UnstyledButton>

      <Stack gap={4} className="dice-event-card__body">
        <Text
          component={Link}
          to={`/eventos/${event.id}`}
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
