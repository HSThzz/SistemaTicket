import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge, Box, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import {
  IconArrowRight,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconTicket,
} from "@tabler/icons-react";
import type { Event } from "../../types/api";
import { extractCity, getEventCoverStyle, getTotalAvailable } from "../../utils/eventVisuals";
import { formatEventDateOnly, formatEventTimeOnly } from "../../utils/format";
import { getEventStatusColor, getEventStatusLabel } from "../../utils/statusLabels";

interface ProducerEventListCardProps {
  event: Event;
}

function InfoBlock({
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
      <Text fw={800} size="md" className="producer-metric-value" c={accent} lineClamp={1}>
        {value}
      </Text>
    </Box>
  );
}

export function ProducerEventListCard({ event }: ProducerEventListCardProps) {
  const totalAvailable = getTotalAvailable(event);
  const soldOut = totalAvailable === 0 && event.ticketLots.length > 0;

  return (
    <Box component={Link} to={`/produtor/eventos/${event.id}`} className="producer-event-card">
      <Group wrap="nowrap" align="stretch" gap={0}>
        <Box className="producer-event-card-stub" style={getEventCoverStyle(event)} />

        <Stack gap="lg" className="producer-event-card-body">
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
            <Stack gap="sm" flex={1} miw={0}>
              <Group gap="sm" wrap="wrap">
                <Badge
                  color={getEventStatusColor(event.status)}
                  variant="light"
                  radius="sm"
                  size="sm"
                >
                  {getEventStatusLabel(event.status)}
                </Badge>
                {event.ticketLots.length > 0 ? (
                  <Badge variant="light" color="gray" radius="sm" size="sm">
                    {event.ticketLots.length} lote{event.ticketLots.length === 1 ? "" : "s"}
                  </Badge>
                ) : null}
              </Group>

              <Title order={4} lineClamp={2} style={{ letterSpacing: "-0.01em" }}>
                {event.title}
              </Title>

              <Group gap={8} c="dimmed" wrap="nowrap">
                <IconMapPin size={16} style={{ flexShrink: 0 }} />
                <Text size="sm" lineClamp={1}>
                  {event.location}
                </Text>
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
            <InfoBlock
              label="Data"
              value={formatEventDateOnly(event.date)}
              icon={<IconCalendar size={16} />}
              accent="blue"
            />
            <InfoBlock
              label="Horário"
              value={formatEventTimeOnly(event.date)}
              icon={<IconClock size={16} />}
              accent="cyan"
            />
            <InfoBlock
              label="Cidade"
              value={extractCity(event.location)}
              icon={<IconMapPin size={16} />}
              accent="grape"
            />
            <InfoBlock
              label="Disponíveis"
              value={
                event.ticketLots.length === 0
                  ? "Sem lotes"
                  : soldOut
                    ? "Esgotado"
                    : String(totalAvailable)
              }
              icon={<IconTicket size={16} />}
              accent={soldOut ? "red" : "teal"}
            />
          </SimpleGrid>
        </Stack>
      </Group>
    </Box>
  );
}
