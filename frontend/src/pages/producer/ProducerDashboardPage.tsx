import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCalendar,
  IconCash,
  IconPlus,
  IconScan,
  IconTicket,
  IconTrendingUp,
} from "@tabler/icons-react";
import * as eventService from "../../services/eventService";
import type { ProducerDashboardStats } from "../../types/api";
import { formatCurrencyFromCents, formatShortDate } from "../../utils/format";
import { getApiErrorMessage } from "../../utils/errors";
import { getEventStatusLabel } from "../../utils/statusLabels";

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Paper p="lg" radius="md" withBorder>
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text size="sm" c="dimmed">
            {label}
          </Text>
          <Text fw={700} size="xl">
            {value}
          </Text>
        </Stack>
        {icon}
      </Group>
    </Paper>
  );
}

export function ProducerDashboardPage() {
  const [stats, setStats] = useState<ProducerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    eventService
      .getProducerDashboardStats()
      .then((data) => {
        if (!cancelled) {
          setStats(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Falha ao carregar estatísticas."));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Center py="xl">
        <Loader color="brand" size="lg" />
      </Center>
    );
  }

  if (error || !stats) {
    return (
      <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro">
        {error ?? "Dados indisponíveis."}
      </Alert>
    );
  }

  const checkInRate =
    stats.summary.ticketsSold > 0
      ? Math.round((stats.summary.ticketsCheckedIn / stats.summary.ticketsSold) * 100)
      : 0;

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={1}>Dashboard de vendas</Title>
          <Text c="dimmed">Visão geral dos seus eventos e ingressos.</Text>
        </Stack>
        <Group>
          <Button component={Link} to="/produtor/eventos" variant="light">
            Meus eventos
          </Button>
          <Button
            component={Link}
            to="/produtor/check-in"
            variant="light"
            leftSection={<IconScan size={18} />}
          >
            Check-in
          </Button>
          <Button component={Link} to="/produtor/eventos/novo" leftSection={<IconPlus size={18} />}>
            Novo evento
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <StatCard
          label="Receita bruta"
          value={formatCurrencyFromCents(stats.summary.grossRevenueCents)}
          icon={<IconCash size={28} color="var(--mantine-color-brand-6)" />}
        />
        <StatCard
          label="Ingressos vendidos"
          value={String(stats.summary.ticketsSold)}
          icon={<IconTicket size={28} color="var(--mantine-color-teal-6)" />}
        />
        <StatCard
          label="Check-ins"
          value={String(stats.summary.ticketsCheckedIn)}
          icon={<IconScan size={28} color="var(--mantine-color-blue-6)" />}
        />
        <StatCard
          label="Taxa de presença"
          value={`${checkInRate}%`}
          icon={<IconTrendingUp size={28} color="var(--mantine-color-grape-6)" />}
        />
      </SimpleGrid>

      <Paper p="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={3}>Desempenho por evento</Title>

          {stats.events.length === 0 ? (
            <Stack gap="md" align="center" py="md">
              <Text c="dimmed">Nenhum evento cadastrado.</Text>
              <Button component={Link} to="/produtor/eventos/novo" leftSection={<IconPlus size={18} />}>
                Criar evento
              </Button>
            </Stack>
          ) : (
            <Table highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Evento</Table.Th>
                  <Table.Th>Vendidos</Table.Th>
                  <Table.Th>Check-in</Table.Th>
                  <Table.Th>Receita</Table.Th>
                  <Table.Th>Ocupação</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {stats.events.map((event) => {
                  const soldPct =
                    event.capacityTotal > 0
                      ? Math.round(
                          ((event.capacityTotal - event.capacityRemaining) /
                            event.capacityTotal) *
                            100,
                        )
                      : 0;

                  return (
                    <Table.Tr key={event.eventId}>
                      <Table.Td>
                        <Stack gap={4}>
                          <Text fw={600}>{event.title}</Text>
                          <Group gap={4} c="dimmed">
                            <IconCalendar size={14} />
                            <Text size="xs">{formatShortDate(event.date)}</Text>
                            <Text size="xs">· {getEventStatusLabel(event.status)}</Text>
                          </Group>
                        </Stack>
                      </Table.Td>
                      <Table.Td>{event.ticketsSold}</Table.Td>
                      <Table.Td>{event.ticketsCheckedIn}</Table.Td>
                      <Table.Td>{formatCurrencyFromCents(event.grossRevenueCents)}</Table.Td>
                      <Table.Td maw={160}>
                        <Stack gap={4}>
                          <Progress value={soldPct} size="sm" color="brand" />
                          <Text size="xs" c="dimmed">
                            {soldPct}% ({event.capacityTotal - event.capacityRemaining}/
                            {event.capacityTotal})
                          </Text>
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
