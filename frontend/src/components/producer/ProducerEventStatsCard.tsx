import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Box, Group, Progress, SimpleGrid, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import {
  IconArrowRight,
  IconCalendar,
  IconCash,
  IconScan,
  IconTicket,
} from "@tabler/icons-react";
import type { ProducerEventStats } from "../../types/api";
import { getEventCoverStyle } from "../../utils/eventVisuals";
import { formatCurrencyFromCents, formatShortDate } from "../../utils/format";
import { EventStatusBadge } from "../ui/EventStatusBadge";

interface ProducerEventStatsCardProps {
  event: ProducerEventStats;
}

function MetricBlock({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: string;
}) {
  return (
    <Box className="producer-metric-block">
      <Group gap={8} wrap="nowrap" mb={6}>
        <ThemeIcon size={28} radius="md" variant="light" color={accent ?? "brand"}>
          {icon}
        </ThemeIcon>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          {label}
        </Text>
      </Group>
      <Text fw={800} size="lg" className="producer-metric-value" c={accent}>
        {value}
      </Text>
    </Box>
  );
}

export function ProducerEventStatsCard({ event }: ProducerEventStatsCardProps) {
  const sold = event.capacityTotal - event.capacityRemaining;
  const soldPct =
    event.capacityTotal > 0 ? Math.round((sold / event.capacityTotal) * 100) : 0;

  return (
    <Box
      component={Link}
      to={`/produtor/eventos/${event.eventId}`}
      className="producer-event-card"
    >
      <Group wrap="nowrap" align="stretch" gap={0}>
        <Box
          className="producer-event-card-stub"
          style={getEventCoverStyle({ id: event.eventId, imageUrl: event.imageUrl })}
        />

        <Stack gap="lg" className="producer-event-card-body">
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
            <Stack gap="sm" flex={1} miw={0}>
              <Group gap="sm" wrap="wrap">
                <EventStatusBadge status={event.status} size="xs" />
              </Group>
              <Title order={4} lineClamp={2} style={{ letterSpacing: "-0.01em" }}>
                {event.title}
              </Title>
              <Group gap={8} c="dimmed" wrap="wrap">
                <IconCalendar size={16} style={{ flexShrink: 0 }} />
                <Text size="sm">{formatShortDate(event.date)}</Text>
              </Group>
            </Stack>
            <Group gap={4} c="brand" className="producer-event-card-cta" wrap="nowrap">
              <Text size="sm" fw={600}>
                Gerenciar
              </Text>
              <IconArrowRight size={16} />
            </Group>
          </Group>

          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <MetricBlock
              label="Vendidos"
              value={String(event.ticketsSold)}
              icon={<IconTicket size={16} />}
              accent="teal"
            />
            <MetricBlock
              label="Check-in"
              value={String(event.ticketsCheckedIn)}
              icon={<IconScan size={16} />}
              accent="blue"
            />
            <MetricBlock
              label="Receita"
              value={formatCurrencyFromCents(event.grossRevenueCents)}
              icon={<IconCash size={16} />}
              accent="green"
            />
            <MetricBlock
              label="Ocupação"
              value={`${soldPct}%`}
              icon={<IconTicket size={16} />}
              accent="brand"
            />
          </SimpleGrid>

          <Stack gap={8}>
            <Group justify="space-between" gap="sm">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Capacidade vendida
              </Text>
              <Text size="sm" fw={600}>
                {sold} / {event.capacityTotal}
              </Text>
            </Group>
            <Progress
              value={soldPct}
              size="lg"
              radius="xl"
              color="brand"
              className="producer-occupancy-progress"
            />
          </Stack>
        </Stack>
      </Group>
    </Box>
  );
}
