/**
 * @file Ranking dos eventos com melhor desempenho de vendas.
 */

import { Badge, Box, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconCash, IconTicket, IconTrophy } from "@tabler/icons-react";
import type { ProducerEventStats } from "../../types/api";
import { formatCurrencyFromCents, formatShortDate } from "../../utils/format";

interface ProducerTopPerformersProps {
  events: ProducerEventStats[];
  limit?: number;
}

/**
 * Exibe os eventos com maior receita no dashboard.
 */
export function ProducerTopPerformers({ events, limit = 3 }: ProducerTopPerformersProps) {
  const top = [...events]
    .filter((event) => event.grossRevenueCents > 0 || event.ticketsSold > 0)
    .sort((a, b) => b.grossRevenueCents - a.grossRevenueCents)
    .slice(0, limit);

  if (top.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="md">
        Ainda sem vendas registradas.
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      {top.map((event, index) => (
        <Box key={event.eventId} className="producer-top-performer-row">
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
            <Group gap="sm" wrap="nowrap" align="flex-start" flex={1} miw={0}>
              <ThemeIcon
                size={32}
                radius="md"
                variant="light"
                color={index === 0 ? "yellow" : index === 1 ? "gray" : "orange"}
              >
                <IconTrophy size={16} />
              </ThemeIcon>
              <Box flex={1} miw={0}>
                <Group gap={6} mb={2} wrap="wrap">
                  <Badge size="xs" variant="dot" color="brand">
                    #{index + 1}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {formatShortDate(event.date)}
                  </Text>
                </Group>
                <Text fw={600} size="sm" lineClamp={2}>
                  {event.title}
                </Text>
              </Box>
            </Group>
          </Group>
          <Group gap="md" mt="xs" pl={42}>
            <Group gap={4} wrap="nowrap">
              <IconTicket size={14} color="var(--mantine-color-teal-6)" />
              <Text size="xs" fw={600}>
                {event.ticketsSold} vendidos
              </Text>
            </Group>
            <Group gap={4} wrap="nowrap">
              <IconCash size={14} color="var(--mantine-color-green-6)" />
              <Text size="xs" fw={700} c="green">
                {formatCurrencyFromCents(event.grossRevenueCents)}
              </Text>
            </Group>
          </Group>
        </Box>
      ))}
    </Stack>
  );
}
