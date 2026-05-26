import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Badge,
  Box,
  Button,
  Container,
  Grid,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconCalendar, IconMapPin, IconTicket } from "@tabler/icons-react";
import { AnimatedSection } from "../components/home/AnimatedSection";
import { PremiumPaper } from "../components/account/PremiumPaper";
import { PageLoader } from "../components/account/PageLoader";
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
    return <PageLoader label="Carregando evento..." />;
  }

  if (error || !event) {
    return (
      <Container size="lg" py="md">
        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro" radius="lg">
          {error ?? "Evento não encontrado."}
        </Alert>
      </Container>
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
        className="full-bleed"
        style={{
          ...getEventCoverStyle(event.id),
          minHeight: 300,
          position: "relative",
        }}
      >
        <Box
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.88) 100%)",
          }}
        />
        <Container size="lg" px="md" style={{ position: "relative", zIndex: 1 }}>
          <Stack justify="flex-end" mih={300} py="xl" gap="md" c="white">
            <Badge color="white" c="dark" variant="filled" w="fit-content" radius="sm">
              {event.ticketLots.length} lote{event.ticketLots.length === 1 ? "" : "s"}
            </Badge>
            <Title
              order={1}
              maw={720}
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", lineHeight: 1.12, letterSpacing: "-0.02em" }}
            >
              {event.title}
            </Title>
            <Group gap="lg" wrap="wrap">
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

      <Container size="lg" py="xl" px="md">
        <Grid>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <AnimatedSection>
              <Stack gap="md">
                <Title order={2} size="h3" className="page-title">
                  Sobre o evento
                </Title>
                <Text c="dimmed" size="lg" style={{ lineHeight: 1.75 }}>
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
              <PremiumPaper
                p="xl"
                style={{ position: "sticky", top: 88 }}
              >
                <Stack gap="lg">
                  <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
                    <Title order={3}>Ingressos</Title>
                    {lowestPrice !== null ? (
                      <Text fw={700} c="brand" size="lg">
                        a partir de {formatCurrencyFromCents(lowestPrice)}
                      </Text>
                    ) : null}
                  </Group>

                  <Text size="sm" c={totalAvailable > 0 ? "teal" : "red"} fw={600}>
                    {totalAvailable > 0
                      ? `${totalAvailable} disponíve${totalAvailable === 1 ? "l" : "is"}`
                      : "Esgotado"}
                  </Text>

                  {event.ticketLots.length === 0 ? (
                    <Text c="dimmed">Este evento ainda não possui lotes.</Text>
                  ) : (
                    <Stack gap="sm">
                      {event.ticketLots.map((lot) => (
                        <Box key={lot.id} className="lot-offer-card" p="md">
                          <Group justify="space-between" align="center" wrap="nowrap" gap="md">
                            <Stack gap={4} flex={1} miw={0}>
                              <Text fw={700}>{lot.name}</Text>
                              <Text size="sm" c="dimmed">
                                {lot.availableQuantity} restantes
                              </Text>
                              <Text fw={700} c="brand">
                                {formatCurrencyFromCents(lot.price)}
                              </Text>
                            </Stack>
                            <Button
                              size="sm"
                              radius="xl"
                              leftSection={<IconTicket size={14} />}
                              disabled={lot.availableQuantity === 0}
                              onClick={() => handleBuy(lot.id)}
                            >
                              {isAuthenticated ? "Comprar" : "Entrar"}
                            </Button>
                          </Group>
                        </Box>
                      ))}
                    </Stack>
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
              </PremiumPaper>
            </AnimatedSection>
          </Grid.Col>
        </Grid>
      </Container>
    </Stack>
  );
}
