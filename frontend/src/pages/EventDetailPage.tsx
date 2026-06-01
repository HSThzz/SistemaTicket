import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconBolt,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconQrcode,
  IconShieldCheck,
  IconTicket,
} from "@tabler/icons-react";
import { AnimatedSection } from "../components/home/AnimatedSection";
import { SiteFooter } from "../components/home/SiteFooter";
import { BackButton } from "../components/account/BackButton";
import { PremiumPaper } from "../components/account/PremiumPaper";
import { PageLoader } from "../components/account/PageLoader";
import { StatCard } from "../components/account/StatCard";
import { useAuth } from "../context/AuthContext";
import * as eventService from "../features/catalog/api/eventService";
import type { Event, TicketLot } from "../types/api";
import {
  CATEGORY_LABELS,
  extractCity,
  getEventCoverStyle,
  getEventGradient,
  getLowestPrice,
  getTotalAvailable,
  inferEventCategory,
  isEventSoon,
} from "../utils/eventVisuals";
import {
  formatCurrencyFromCents,
  formatEventDateOnly,
  formatEventTimeOnly,
} from "../utils/format";
import { getApiErrorMessage } from "../utils/errors";

const EVENT_PERKS = [
  { icon: IconBolt, label: "PIX instantâneo", description: "Pague e receba na hora" },
  { icon: IconQrcode, label: "QR Code digital", description: "Check-in rápido na entrada" },
  { icon: IconShieldCheck, label: "Compra segura", description: "Reserva garantida por 15 min" },
] as const;

function LotOfferCard({
  lot,
  isAuthenticated,
  onBuy,
}: {
  lot: TicketLot;
  isAuthenticated: boolean;
  onBuy: (lotId: string) => void;
}) {
  const soldOut = lot.availableQuantity === 0;
  const lowStock = lot.availableQuantity > 0 && lot.availableQuantity <= 20;

  return (
    <Box className="lot-offer-card" p="md">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
          <Text fw={700} lineClamp={2} flex={1}>
            {lot.name}
          </Text>
          {lowStock ? (
            <Badge color="orange" variant="filled" size="sm" radius="sm">
              Últimos
            </Badge>
          ) : null}
          {soldOut ? (
            <Badge color="red" variant="filled" size="sm" radius="sm">
              Esgotado
            </Badge>
          ) : null}
        </Group>

        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Badge variant="light" color={soldOut ? "gray" : "teal"} radius="sm">
            {soldOut ? "Sem estoque" : `${lot.availableQuantity} restantes`}
          </Badge>
          <Text fw={800} size="lg" c="brand" className="lot-offer-card__price">
            {formatCurrencyFromCents(lot.price)}
          </Text>
        </Group>

        <Button
          fullWidth
          radius="xl"
          leftSection={<IconTicket size={16} />}
          disabled={soldOut}
          onClick={() => onBuy(lot.id)}
        >
          {isAuthenticated ? "Comprar ingresso" : "Entrar para comprar"}
        </Button>
      </Stack>
    </Box>
  );
}

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
  const category = inferEventCategory(event);
  const [glowColor] = getEventGradient(event.id);
  const soldOut = totalAvailable === 0;
  const lowStock = totalAvailable > 0 && totalAvailable <= 20;

  const handleBuy = (lotId: string) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/eventos/${event.id}` } });
      return;
    }

    navigate(`/eventos/${event.id}/comprar?lot=${lotId}`);
  };

  return (
    <Stack gap={0}>
      <Box className="event-detail-hero full-bleed" style={getEventCoverStyle(event)}>
        <Box
          className="hero-glow"
          style={{
            top: "8%",
            right: "6%",
            background: glowColor,
          }}
        />
        <Box
          className="hero-glow"
          style={{
            bottom: "12%",
            left: "4%",
            background: glowColor,
            animationDelay: "2.5s",
            width: 200,
            height: 200,
          }}
        />
        <Box className="producer-manage-hero-overlay" />
        <Container size="lg" px="md" className="event-detail-hero-content">
          <BackButton to="/" label="Voltar aos eventos" inverted style={{ alignSelf: "flex-start" }} />

          <Stack gap="md">
              <Group gap="xs" wrap="wrap">
                <Badge color="white" c="dark" variant="filled" radius="sm">
                  {CATEGORY_LABELS[category]}
                </Badge>
                {isEventSoon(event) ? (
                  <Badge color="orange" variant="filled" radius="sm">
                    Em breve
                  </Badge>
                ) : null}
                {lowStock ? (
                  <Badge color="orange" variant="filled" radius="sm">
                    Últimos ingressos
                  </Badge>
                ) : null}
                {lowestPrice !== null ? (
                  <Badge color="white" c="dark" variant="filled" radius="sm">
                    a partir de {formatCurrencyFromCents(lowestPrice)}
                  </Badge>
                ) : null}
              </Group>

              <Title
                order={1}
                maw={760}
                style={{
                  fontSize: "clamp(2rem, 5vw, 3rem)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
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
                  <Text fw={500}>{formatEventDateOnly(event.date)}</Text>
                </Group>
                <Group gap={6}>
                  <IconClock size={18} />
                  <Text fw={500}>{formatEventTimeOnly(event.date)}</Text>
                </Group>
              </Group>
          </Stack>
        </Container>
      </Box>

      <Box className="event-detail-body">
        <Container size="lg" px="md" className="event-detail-stats">
          <AnimatedSection>
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
              <StatCard
                label="Data"
                value={formatEventDateOnly(event.date)}
                icon={<IconCalendar size={20} />}
                iconColor="blue"
                valueColor="blue"
              />
              <StatCard
                label="Horário"
                value={formatEventTimeOnly(event.date)}
                icon={<IconClock size={20} />}
                iconColor="cyan"
                valueColor="cyan"
              />
              <StatCard
                label="Local"
                value={extractCity(event.location)}
                icon={<IconMapPin size={20} />}
                iconColor="grape"
                valueColor="grape"
              />
              <StatCard
                label="Disponíveis"
                value={soldOut ? "Esgotado" : String(totalAvailable)}
                icon={<IconTicket size={20} />}
                iconColor={soldOut ? "red" : "teal"}
                valueColor={soldOut ? "red" : "teal"}
              />
            </SimpleGrid>
          </AnimatedSection>
        </Container>

        <Container size="lg" py="xl" px="md">
          <Grid gap="xl">
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Stack gap="xl">
                <AnimatedSection delayMs={60}>
                  <PremiumPaper p="xl">
                    <Stack gap="lg">
                      <Group gap="sm">
                        <ThemeIcon size={40} radius="md" variant="light" color="brand">
                          <IconTicket size={20} />
                        </ThemeIcon>
                        <Stack gap={2}>
                          <Title order={2} size="h3" className="page-title">
                            Sobre o evento
                          </Title>
                          <Text size="sm" c="dimmed">
                            Tudo o que você precisa saber antes de garantir seu ingresso.
                          </Text>
                        </Stack>
                      </Group>

                      <Text size="lg" style={{ lineHeight: 1.8 }}>
                        {event.description}
                      </Text>

                      <Divider />

                      <Group gap="sm" wrap="nowrap" align="flex-start">
                        <ThemeIcon size={36} radius="md" variant="light" color="grape">
                          <IconMapPin size={18} />
                        </ThemeIcon>
                        <Stack gap={2}>
                          <Text fw={600}>Local do evento</Text>
                          <Text c="dimmed">{event.location}</Text>
                        </Stack>
                      </Group>
                    </Stack>
                  </PremiumPaper>
                </AnimatedSection>

                <AnimatedSection delayMs={120}>
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                    {EVENT_PERKS.map((perk) => (
                      <PremiumPaper key={perk.label} p="lg">
                        <Stack gap="sm">
                          <ThemeIcon size={36} radius="md" variant="light" color="brand">
                            <perk.icon size={18} />
                          </ThemeIcon>
                          <Text fw={700}>{perk.label}</Text>
                          <Text size="sm" c="dimmed" style={{ lineHeight: 1.55 }}>
                            {perk.description}
                          </Text>
                        </Stack>
                      </PremiumPaper>
                    ))}
                  </SimpleGrid>
                </AnimatedSection>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 5 }}>
              <AnimatedSection delayMs={100}>
                <PremiumPaper p="xl" className="event-detail-tickets-panel">
                  <Stack gap="lg">
                    <Stack gap={4}>
                      <Title order={3}>Ingressos</Title>
                      <Text size="sm" c="dimmed">
                        Escolha o lote ideal e finalize com PIX em minutos.
                      </Text>
                    </Stack>

                    <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                      {lowestPrice !== null ? (
                        <Text fw={800} size="xl" c="brand">
                          a partir de {formatCurrencyFromCents(lowestPrice)}
                        </Text>
                      ) : (
                        <Text fw={600} c="dimmed">
                          Sem lotes disponíveis
                        </Text>
                      )}
                      <Badge
                        size="lg"
                        variant="light"
                        color={soldOut ? "red" : "teal"}
                        radius="sm"
                      >
                        {soldOut
                          ? "Esgotado"
                          : `${totalAvailable} disponíve${totalAvailable === 1 ? "l" : "is"}`}
                      </Badge>
                    </Group>

                    <Divider />

                    {event.ticketLots.length === 0 ? (
                      <Box className="empty-state-card" p="xl" style={{ borderRadius: "var(--mantine-radius-lg)" }}>
                        <Stack gap="xs" align="center">
                          <ThemeIcon size={48} radius="xl" variant="light" color="gray">
                            <IconTicket size={24} />
                          </ThemeIcon>
                          <Text fw={600} ta="center">
                            Lotes em breve
                          </Text>
                          <Text size="sm" c="dimmed" ta="center">
                            Este evento ainda não possui lotes de ingressos publicados.
                          </Text>
                        </Stack>
                      </Box>
                    ) : (
                      <Stack gap="sm">
                        {event.ticketLots.map((lot) => (
                          <LotOfferCard
                            key={lot.id}
                            lot={lot}
                            isAuthenticated={isAuthenticated}
                            onBuy={handleBuy}
                          />
                        ))}
                      </Stack>
                    )}

                    {!isAuthenticated ? (
                      <Text size="sm" c="dimmed" ta="center">
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

        <SiteFooter />
      </Box>
    </Stack>
  );
}
