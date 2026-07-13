/**
 * @file Card de evento para vitrine com variantes de layout.
 * @module components/EventCard
 */

import { Link } from "react-router-dom";
import { Box, Card, Group, Stack, Text, Title } from "@mantine/core";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import { IconCalendar, IconMapPin, IconTicket } from "@tabler/icons-react";
import {
  EventPrivateBadge,
  isPrivateEvent,
} from "@/modules/catalog/features/browse/components/EventPrivateBadge";
import { ParticipationStatusBadge } from "@/components/ui/ParticipationStatusBadge";
import type { Event } from "@/shared/types/api";
import { useParticipation } from "@/modules/participation/features/requests/hooks/useParticipation";
import {
  extractCity,
  getEventCoverStyle,
  getLowestPrice,
  getTotalAvailable,
} from "@/modules/catalog/utils/eventVisuals";
import { formatEventDateOnly, formatEventTimeOnly, formatLotPrice } from "@/shared/utils/format";

/** Propriedades do card de evento na listagem. */
interface EventCardProps {
  /** Evento com lotes, data e imagem. */
  event: Event;
  /** Layout: card vertical padrão, compacto ou lista horizontal. */
  variant?: "default" | "compact" | "horizontal";
}

/**
 * Card clicável que leva à página de detalhe do evento.
 * Exibe capa, preço mínimo, estoque e badges de esgotado/últimas unidades.
 */
export function EventCard({ event, variant = "default" }: EventCardProps) {
  const { getParticipationStatus } = useParticipation();
  const participationStatus = isPrivateEvent(event)
    ? getParticipationStatus(event.id)
    : null;
  const lowestPrice = getLowestPrice(event);
  const totalAvailable = getTotalAvailable(event);
  const soldOut = totalAvailable === 0;

  if (variant === "horizontal") {
    return (
      <Card
        component={Link}
        to={`/eventos/${event.id}`}
        padding="sm"
        radius="lg"
        withBorder
        className="event-card-root"
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <Group wrap="nowrap" align="stretch" gap="md">
          <Box
            className="event-card-cover"
            style={{ ...getEventCoverStyle(event), width: 120, flexShrink: 0 }}
          />
          <Stack gap={4} justify="center" flex={1}>
            <Group gap="xs" wrap="wrap" align="center">
              <Text fw={700} lineClamp={2} flex={1}>
                {event.title}
              </Text>
              {isPrivateEvent(event) ? <EventPrivateBadge size="xs" /> : null}
              {participationStatus ? (
                <ParticipationStatusBadge status={participationStatus} size="xs" />
              ) : null}
            </Group>
            <Group gap={6} c="dimmed">
              <IconMapPin size={14} />
              <Text size="xs" lineClamp={1}>
                {extractCity(event.location)}
              </Text>
            </Group>
            <Group gap={8} c="dimmed" wrap="wrap">
              <Group gap={4}>
                <IconCalendar size={14} />
                <Text size="xs">{formatEventDateOnly(event.date)}</Text>
              </Group>
              <Text size="xs" c="dimmed">
                ·
              </Text>
              <Text size="xs">{formatEventTimeOnly(event.date)}</Text>
            </Group>
          </Stack>
        </Group>
      </Card>
    );
  }

  return (
    <Card
      component={Link}
      to={`/eventos/${event.id}`}
      padding={0}
      radius="lg"
      withBorder
      className="event-card-root"
      style={{ textDecoration: "none", color: "inherit", overflow: "hidden" }}
    >
      <Box className="event-card-cover" style={getEventCoverStyle(event)}>
        <Group justify="space-between" p="sm" align="flex-start" wrap="wrap" gap="xs">
          <Group gap="xs" wrap="wrap">
            {isPrivateEvent(event) ? <EventPrivateBadge size="sm" overlay /> : null}
            {participationStatus ? (
              <ParticipationStatusBadge status={participationStatus} size="xs" overlay />
            ) : null}
          </Group>
          {soldOut ? (
            <PremiumBadge tone="sold-out" size="sm" overlay>
              Esgotado
            </PremiumBadge>
          ) : null}
        </Group>
      </Box>

      <Stack gap="xs" p={variant === "compact" ? "sm" : "md"}>
        <Title order={variant === "compact" ? 4 : 3} lineClamp={2} size={variant === "compact" ? "md" : undefined}>
          {event.title}
        </Title>

        <Group gap={6} c="dimmed">
          <IconMapPin size={15} />
          <Text size="sm" lineClamp={1}>
            {extractCity(event.location)}
          </Text>
        </Group>

        <Group gap={8} c="dimmed" wrap="wrap">
          <Group gap={4}>
            <IconCalendar size={15} />
            <Text size="sm">{formatEventDateOnly(event.date)}</Text>
          </Group>
          <Text size="sm" c="dimmed">
            ·
          </Text>
          <Text size="sm">{formatEventTimeOnly(event.date)}</Text>
        </Group>

        <Group justify="space-between" align="center" mt={4}>
          {lowestPrice !== null ? (
            <Text size="sm" fw={700} c="brand">
              {formatLotPrice(lowestPrice)}
            </Text>
          ) : (
            <Text size="sm" c="dimmed">
              Sem lotes
            </Text>
          )}

          <Group gap={4} className="event-card-cta" c="brand" fw={600} fz="sm">
            <IconTicket size={16} />
            <Text size="sm" fw={600}>
              Ver
            </Text>
          </Group>
        </Group>
      </Stack>
    </Card>
  );
}
