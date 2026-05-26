import { Link } from "react-router-dom";
import { Badge, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { IconCalendar, IconMapPin } from "@tabler/icons-react";
import type { Event } from "../types/api";
import { formatCurrencyFromCents, formatShortDate } from "../utils/format";

interface EventCardProps {
  event: Event;
}

function getLowestPrice(event: Event): number | null {
  if (event.ticketLots.length === 0) {
    return null;
  }

  return Math.min(...event.ticketLots.map((lot) => lot.price));
}

function getTotalAvailable(event: Event): number {
  return event.ticketLots.reduce((sum, lot) => sum + lot.availableQuantity, 0);
}

export function EventCard({ event }: EventCardProps) {
  const lowestPrice = getLowestPrice(event);
  const totalAvailable = getTotalAvailable(event);

  return (
    <Card component="article" padding="lg" radius="md" withBorder h="100%">
      <Stack justify="space-between" h="100%" gap="md">
        <Stack gap="xs">
          <Group justify="space-between" align="flex-start">
            <Title order={3} lineClamp={2}>
              {event.title}
            </Title>
            {lowestPrice !== null ? (
              <Badge color="brand" variant="light" size="lg">
                a partir de {formatCurrencyFromCents(lowestPrice)}
              </Badge>
            ) : null}
          </Group>

          <Text c="dimmed" lineClamp={2}>
            {event.description}
          </Text>

          <Group gap="xs" c="dimmed">
            <IconCalendar size={16} />
            <Text size="sm">{formatShortDate(event.date)}</Text>
          </Group>

          <Group gap="xs" c="dimmed">
            <IconMapPin size={16} />
            <Text size="sm" lineClamp={1}>
              {event.location}
            </Text>
          </Group>
        </Stack>

        <Group justify="space-between" align="center">
          <Text size="sm" c={totalAvailable > 0 ? "teal" : "red"} fw={500}>
            {totalAvailable > 0
              ? `${totalAvailable} ingresso${totalAvailable === 1 ? "" : "s"} disponíve${totalAvailable === 1 ? "l" : "is"}`
              : "Esgotado"}
          </Text>
          <Button component={Link} to={`/eventos/${event.id}`} variant="light">
            Ver detalhes
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
