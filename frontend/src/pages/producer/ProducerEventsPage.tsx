import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconPlus, IconScan } from "@tabler/icons-react";
import * as eventService from "../../services/eventService";
import type { Event } from "../../types/api";
import { formatShortDate } from "../../utils/format";
import { getApiErrorMessage } from "../../utils/errors";
import { getEventStatusColor, getEventStatusLabel } from "../../utils/statusLabels";

export function ProducerEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    eventService
      .listManagedEvents()
      .then((data) => {
        if (!cancelled) {
          setEvents(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Não foi possível carregar seus eventos."));
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

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={1}>Painel do produtor</Title>
          <Text c="dimmed">Gerencie eventos, lotes e check-in na portaria.</Text>
        </Stack>
        <Group>
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

      {error ? (
        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro">
          {error}
        </Alert>
      ) : null}

      {!error && events.length === 0 ? (
        <Paper p="xl" radius="md" withBorder>
          <Stack gap="md" align="center">
            <Text c="dimmed">Você ainda não criou nenhum evento.</Text>
            <Button component={Link} to="/produtor/eventos/novo" leftSection={<IconPlus size={18} />}>
              Criar primeiro evento
            </Button>
          </Stack>
        </Paper>
      ) : null}

      {events.length > 0 ? (
        <Paper radius="md" withBorder>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Evento</Table.Th>
                <Table.Th>Data</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Lotes</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {events.map((event) => (
                <Table.Tr key={event.id}>
                  <Table.Td>
                    <Stack gap={2}>
                      <Text fw={600}>{event.title}</Text>
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {event.location}
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>{formatShortDate(event.date)}</Table.Td>
                  <Table.Td>
                    <Badge color={getEventStatusColor(event.status)} variant="light">
                      {getEventStatusLabel(event.status)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{event.ticketLots.length}</Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      variant="light"
                      component={Link}
                      to={`/produtor/eventos/${event.id}`}
                    >
                      Gerenciar
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      ) : null}
    </Stack>
  );
}
