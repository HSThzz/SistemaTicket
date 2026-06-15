import type { MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ActionIcon, Box, Stack, Text, UnstyledButton } from "@mantine/core";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";
import { useAuth } from "../../context/AuthContext";
import { useFavorites } from "../../hooks/useFavorites";
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
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = isFavorite(event.id);
  const lowestPrice = getLowestPrice(event);
  const totalAvailable = getTotalAvailable(event);
  const soldOut = totalAvailable === 0;
  const venue = extractCity(event.location);

  const handleFavoriteClick = (clickEvent: MouseEvent) => {
    clickEvent.preventDefault();
    clickEvent.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    toggleFavorite(event.id).catch(() => undefined);
  };

  return (
    <Box className="dice-event-card">
      <UnstyledButton
        component={Link}
        to={`/eventos/${event.id}`}
        className="dice-event-card__link"
      >
        <Box className="dice-event-card__cover" style={getEventCoverStyle(event)}>
          {soldOut ? <span className="dice-event-card__badge">Esgotado</span> : null}
          <ActionIcon
            className="dice-event-card__heart"
            variant="filled"
            radius="xl"
            size="lg"
            aria-label={liked ? "Remover dos favoritos" : "Salvar evento"}
            aria-pressed={liked}
            onClick={handleFavoriteClick}
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
