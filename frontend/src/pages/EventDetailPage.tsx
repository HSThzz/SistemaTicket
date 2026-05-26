import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import { IconAlertCircle, IconCalendar, IconMapPin } from "@tabler/icons-react";
import { useAuth } from "../context/AuthContext";
import * as eventService from "../services/eventService";
import type { Event } from "../types/api";
import { formatCurrencyFromCents, formatEventDate } from "../utils/format";
import { getApiErrorMessage } from "../utils/errors";

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setError("Evento inválido.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    eventService
      .getPublishedEvent(eventId)
      .then((data) => {
        if (!cancelled) {
          setEvent(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Evento não encontrado."));
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
  }, [eventId]);

  if (loading) {
    return (
      <Center py="xl">
        <Loader color="brand" size="lg" />
      </Center>
    );
  }

  if (error || !event) {
    return (
      <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro">
        {error ?? "Evento não encontrado."}
      </Alert>
    );
  }

  const handleBuy = (lotId: string) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/eventos/${event.id}` } });
      return;
    }

    navigate(`/eventos/${event.id}/comprar?lot=${lotId}`);
  };

  return (
    <Stack gap="xl">
      <Stack gap="sm">
        <Title order={1}>{event.title}</Title>
        <Text c="dimmed" size="lg">
          {event.description}
        </Text>
        <Group gap="lg">
          <Group gap="xs" c="dimmed">
            <IconCalendar size={18} />
            <Text>{formatEventDate(event.date)}</Text>
          </Group>
          <Group gap="xs" c="dimmed">
            <IconMapPin size={18} />
            <Text>{event.location}</Text>
          </Group>
        </Group>
      </Stack>

      <Paper p="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={3}>Lotes disponíveis</Title>
            <Badge color="brand" variant="light">
              {event.ticketLots.length} lote{event.ticketLots.length === 1 ? "" : "s"}
            </Badge>
          </Group>

          {event.ticketLots.length === 0 ? (
            <Text c="dimmed">Este evento ainda não possui lotes de ingressos.</Text>
          ) : (
            <Table highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Lote</Table.Th>
                  <Table.Th>Preço</Table.Th>
                  <Table.Th>Disponíveis</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {event.ticketLots.map((lot) => (
                  <Table.Tr key={lot.id}>
                    <Table.Td>{lot.name}</Table.Td>
                    <Table.Td>{formatCurrencyFromCents(lot.price)}</Table.Td>
                    <Table.Td>
                      <Text c={lot.availableQuantity > 0 ? "teal" : "red"} fw={500}>
                        {lot.availableQuantity}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Button
                        size="sm"
                        disabled={lot.availableQuantity === 0}
                        onClick={() => handleBuy(lot.id)}
                      >
                        {isAuthenticated ? "Comprar" : "Entrar para comprar"}
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}

          {!isAuthenticated ? (
            <Text size="sm" c="dimmed">
              <Link to="/login" state={{ from: `/eventos/${event.id}` }}>
                Faça login
              </Link>{" "}
              ou{" "}
              <Link to="/cadastro">cadastre-se</Link> para reservar ingressos.
            </Text>
          ) : null}
        </Stack>
      </Paper>
    </Stack>
  );
}
