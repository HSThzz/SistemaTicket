import { Link } from "react-router-dom";
import { Badge, Box, Card, Group, Stack, Text, Title } from "@mantine/core";
import { IconCalendar, IconMapPin, IconTicket } from "@tabler/icons-react";
import type { Event } from "../types/api";
import {
  extractCity,
  getEventCoverStyle,
  getLowestPrice,
  getTotalAvailable,
} from "../utils/eventVisuals";
import { formatCurrencyFromCents, formatShortDate } from "../utils/format";

interface EventCardProps {
  event: Event;
  variant?: "default" | "compact" | "horizontal";
}

export function EventCard({ event, variant = "default" }: EventCardProps) {
  const lowestPrice = getLowestPrice(event);
  const totalAvailable = getTotalAvailable(event);
  const soldOut = totalAvailable === 0;
  const lowStock = totalAvailable > 0 && totalAvailable <= 20;

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
            style={{ ...getEventCoverStyle(event.id), width: 120, flexShrink: 0 }}
          />
          <Stack gap={4} justify="center" flex={1}>
            <Text fw={700} lineClamp={2}>
              {event.title}
            </Text>
            <Group gap={6} c="dimmed">
              <IconMapPin size={14} />
              <Text size="xs" lineClamp={1}>
                {extractCity(event.location)}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {formatShortDate(event.date)}
            </Text>
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
      <Box className="event-card-cover" style={getEventCoverStyle(event.id)}>
        <Group justify="space-between" p="sm" align="flex-start">
          {lowStock ? (
            <Badge color="orange" variant="filled" size="sm">
              Acabando
            </Badge>
          ) : (
            <Box />
          )}
          {soldOut ? (
            <Badge color="red" variant="filled" size="sm">
              Esgotado
            </Badge>
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

        <Group gap={6} c="dimmed">
          <IconCalendar size={15} />
          <Text size="sm">{formatShortDate(event.date)}</Text>
        </Group>

        <Group justify="space-between" align="center" mt={4}>
          {lowestPrice !== null ? (
            <Text size="sm" fw={700} c="brand">
              {formatCurrencyFromCents(lowestPrice)}
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
