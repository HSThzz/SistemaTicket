import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Badge,
  Box,
  Button,
  Center,
  Container,
  Grid,
  Group,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconCalendar, IconMapPin, IconTicket } from "@tabler/icons-react";
import { AnimatedSection } from "../components/home/AnimatedSection";
import { useAuth } from "../context/AuthContext";
import * as eventService from "../services/eventService";
import type { Event } from "../types/api";
import {
  extractCity,
  getEventCoverStyle,
  getLowestPrice,
  getTotalAvailable,
} from "../utils/eventVisuals";
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

  const lowestPrice = getLowestPrice(event);
  const totalAvailable = getTotalAvailable(event);

  const handleBuy = (lotId: string) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/eventos/${event.id}` } });
      return;
    }

    navigate(`/eventos/${event.id}/comprar?lot=${lotId}`);
  };

  return (
    <Stack gap={0}>
      <Box
        style={{
          ...getEventCoverStyle(event.id),
          minHeight: 280,
          position: "relative",
        }}
      >
        <Box
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.85) 100%)",
          }}
        />
        <Container size="lg" style={{ position: "relative", zIndex: 1 }}>
          <Stack justify="flex-end" mih={280} py="xl" gap="md" c="white">
            <Badge color="white" c="dark" variant="filled" w="fit-content">
              {event.ticketLots.length} lote{event.ticketLots.length === 1 ? "" : "s"}
            </Badge>
            <Title order={1} maw={720} style={{ lineHeight: 1.15 }}>
              {event.title}
            </Title>
            <Group gap="lg">
              <Group gap={6}>
                <IconMapPin size={18} />
                <Text fw={500}>{extractCity(event.location)}</Text>
              </Group>
              <Group gap={6}>
                <IconCalendar size={18} />
                <Text fw={500}>{formatEventDate(event.date)}</Text>
              </Group>
            </Group>
          </Stack>
        </Container>
      </Box>

      <Container size="lg" py="xl">
        <Grid gap="xl">
          <Grid.Col span={{ base: 12, md: 7 }}>
            <AnimatedSection>
              <Stack gap="md">
                <Title order={2} size="h3">
                  Sobre o evento
                </Title>
                <Text c="dimmed" size="lg" style={{ lineHeight: 1.7 }}>
                  {event.description}
                </Text>
                <Group gap="xs" c="dimmed">
                  <IconMapPin size={16} />
                  <Text>{event.location}</Text>
                </Group>
              </Stack>
            </AnimatedSection>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }}>
            <AnimatedSection delayMs={100}>
              <Paper p="lg" radius="lg" withBorder shadow="md" style={{ position: "sticky", top: 88 }}>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Title order={3}>Ingressos</Title>
                    {lowestPrice !== null ? (
                      <Text fw={700} c="brand">
                        a partir de {formatCurrencyFromCents(lowestPrice)}
                      </Text>
                    ) : null}
                  </Group>

                  <Text size="sm" c={totalAvailable > 0 ? "teal" : "red"} fw={500}>
                    {totalAvailable > 0
                      ? `${totalAvailable} disponíve${totalAvailable === 1 ? "l" : "is"}`
                      : "Esgotado"}
                  </Text>

                  {event.ticketLots.length === 0 ? (
                    <Text c="dimmed">Este evento ainda não possui lotes.</Text>
                  ) : (
                    <Table highlightOnHover withTableBorder layout="fixed">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Lote</Table.Th>
                          <Table.Th>Preço</Table.Th>
                          <Table.Th />
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {event.ticketLots.map((lot) => (
                          <Table.Tr key={lot.id}>
                            <Table.Td>
                              <Text fw={500} size="sm">
                                {lot.name}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {lot.availableQuantity} restantes
                              </Text>
                            </Table.Td>
                            <Table.Td>{formatCurrencyFromCents(lot.price)}</Table.Td>
                            <Table.Td>
                              <Button
                                size="xs"
                                radius="xl"
                                leftSection={<IconTicket size={14} />}
                                disabled={lot.availableQuantity === 0}
                                onClick={() => handleBuy(lot.id)}
                              >
                                {isAuthenticated ? "Comprar" : "Entrar"}
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
                      ou <Link to="/cadastro">cadastre-se</Link> para reservar.
                    </Text>
                  ) : null}
                </Stack>
              </Paper>
            </AnimatedSection>
          </Grid.Col>
        </Grid>
      </Container>
    </Stack>
  );
}
