/**
 * @file Tabela compacta de desempenho por evento no dashboard do produtor.
 */

import { Badge, Box, Group, Progress, Table, Text } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import type { ProducerEventStats } from "../../types/api";
import { formatCurrencyFromCents, formatShortDate } from "../../utils/format";
import { getEventStatusColor, getEventStatusLabel } from "../../utils/statusLabels";
import { EventPrivateBadge, isPrivateEvent } from "../events/EventPrivateBadge";

interface ProducerDashboardPerformanceTableProps {
  events: ProducerEventStats[];
}

function getOccupancy(event: ProducerEventStats): number {
  if (event.capacityTotal <= 0) {
    return 0;
  }

  const sold = event.capacityTotal - event.capacityRemaining;
  return Math.round((sold / event.capacityTotal) * 100);
}

function getCheckInRate(event: ProducerEventStats): number {
  if (event.ticketsSold <= 0) {
    return 0;
  }

  return Math.round((event.ticketsCheckedIn / event.ticketsSold) * 100);
}

/**
 * Visão tabular das métricas de venda — substitui os cards grandes do dashboard.
 */
export function ProducerDashboardPerformanceTable({
  events,
}: ProducerDashboardPerformanceTableProps) {
  const navigate = useNavigate();
  const sorted = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return (
    <Box className="data-table-panel producer-performance-table">
      <Table.ScrollContainer minWidth={720}>
        <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Evento</Table.Th>
              <Table.Th>Data</Table.Th>
              <Table.Th>Vendidos</Table.Th>
              <Table.Th>Check-in</Table.Th>
              <Table.Th>Receita</Table.Th>
              <Table.Th>Ocupação</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sorted.map((event) => {
              const occupancy = getOccupancy(event);
              const checkInRate = getCheckInRate(event);

              return (
                <Table.Tr
                  key={event.eventId}
                  className="producer-performance-row"
                  onClick={() => navigate(`/produtor/eventos/${event.eventId}`)}
                >
                  <Table.Td>
                    <Group gap="sm" wrap="nowrap" align="flex-start">
                      <Box flex={1} miw={0}>
                        <Text fw={600} size="sm" lineClamp={1}>
                          {event.title}
                        </Text>
                        <Group gap={6} mt={4} wrap="wrap">
                          <Badge
                            size="xs"
                            variant="light"
                            color={getEventStatusColor(event.status)}
                            radius="sm"
                          >
                            {getEventStatusLabel(event.status)}
                          </Badge>
                          {isPrivateEvent(event) ? (
                            <EventPrivateBadge size="xs" variant="light" />
                          ) : null}
                        </Group>
                      </Box>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {formatShortDate(event.date)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={600}>
                      {event.ticketsSold}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={600}>
                      {event.ticketsCheckedIn}
                      {event.ticketsSold > 0 ? (
                        <Text component="span" size="xs" c="dimmed" ml={4}>
                          ({checkInRate}%)
                        </Text>
                      ) : null}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={600} c="green">
                      {formatCurrencyFromCents(event.grossRevenueCents)}
                    </Text>
                  </Table.Td>
                  <Table.Td miw={140}>
                    <Group gap={8} wrap="nowrap">
                      <Progress
                        value={occupancy}
                        size="sm"
                        radius="xl"
                        color="brand"
                        flex={1}
                        className="producer-occupancy-progress"
                      />
                      <Text size="xs" fw={600} w={36} ta="right">
                        {occupancy}%
                      </Text>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Box>
  );
}
