/**
 * @file Ranking dos eventos com melhor desempenho de vendas.
 */

import { Badge, Box, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconCash, IconTicket, IconTrophy } from "@tabler/icons-react";
import { PremiumPaper } from "../account/PremiumPaper";
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
    return null;
  }

  return (
    <Stack gap="sm">
      {top.map((event, index) => (
        <PremiumPaper key={event.eventId} p="md" className="producer-top-performer">
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
            <Group gap="md" wrap="nowrap" align="flex-start" flex={1} miw={0}>
              <ThemeIcon
                size={36}
                radius="md"
                variant="light"
                color={index === 0 ? "yellow" : index === 1 ? "gray" : "orange"}
              >
                <IconTrophy size={18} />
              </ThemeIcon>
              <Box flex={1} miw={0}>
                <Group gap="xs" mb={4}>
                  <Badge size="xs" variant="dot" color="brand">
                    #{index + 1}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {formatShortDate(event.date)}
                  </Text>
                </Group>
                <Text fw={700} size="sm" lineClamp={1}>
                  {event.title}
                </Text>
              </Box>
            </Group>

            <Group gap="lg" wrap="wrap">
              <Group gap={6} wrap="nowrap">
                <IconTicket size={16} color="var(--mantine-color-teal-6)" />
                <Text size="sm" fw={600}>
                  {event.ticketsSold}
                </Text>
              </Group>
              <Group gap={6} wrap="nowrap">
                <IconCash size={16} color="var(--mantine-color-green-6)" />
                <Text size="sm" fw={700} c="green">
                  {formatCurrencyFromCents(event.grossRevenueCents)}
                </Text>
              </Group>
            </Group>
          </Group>
        </PremiumPaper>
      ))}
    </Stack>
  );
}
