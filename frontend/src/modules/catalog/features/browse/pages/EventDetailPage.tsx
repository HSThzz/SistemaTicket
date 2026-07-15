/**
 * @file Página pública de detalhe do evento com lotes e CTA de compra.
 * @module pages/EventDetailPage
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
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
  IconCircleCheck,
  IconClock,
  IconMapPin,
  IconQrcode,
  IconShieldCheck,
  IconTicket,
} from "@tabler/icons-react";
import { EventFavoriteButton } from "@/components/ui/EventFavoriteButton";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import { EventPrivateBadge } from "@/modules/catalog/features/browse/components/EventPrivateBadge";
import { AnimatedSection } from "@/shared/components/AnimatedSection";
import { SiteFooter } from "@/app/components/SiteFooter";
import { PageBackNav } from "@/shared/components/PageBackNav";
import { PremiumPaper } from "@/shared/components/PremiumPaper";
import { PageLoader } from "@/shared/components/PageLoader";
import { StatCard } from "@/shared/components/StatCard";
import { ParticipationRequestCard } from "@/modules/participation/features/requests/components/ParticipationRequestCard";
import { useAuth } from "@/modules/identity/features/auth/context/AuthContext";
import { useEventFavoriteAction } from "@/modules/identity/features/profile/hooks/useEventFavoriteAction";
import { useParticipation } from "@/modules/participation/features/requests/hooks/useParticipation";
import * as eventService from "@/modules/catalog/api/eventService";
import * as participationService from "@/modules/participation/api/participationService";
import type { Event, ParticipationRequest, ParticipationRequestStatus, TicketLot } from "@/shared/types/api";
import { useEventCoverPreload } from "@/modules/catalog/features/browse/hooks/useEventCoverPreload";
import {
  CATEGORY_LABELS,
  extractCity,
  getEventCoverImageUrl,
  getEventCoverStyle,
  getLowestPrice,
  getTotalAvailable,
  inferEventCategory,
  preloadEventCoverImage,
} from "@/modules/catalog/utils/eventVisuals";
import { eventCheckoutPath, eventPath } from "@/modules/catalog/utils/eventPaths";
import {
  formatCurrencyFromCents,
  formatEventDateOnly,
  formatEventTimeOnly,
  formatLotPrice,
} from "@/shared/utils/format";
import { calculatePlatformFeeCents } from "@/shared/utils/platformFee";
import { usePlatformFeePercent } from "@/shared/hooks/usePlatformFeePercent";
import { getApiErrorMessage } from "@/shared/utils/errors";

const EVENT_PERKS = [
  { icon: IconBolt, label: "PIX instantâneo", description: "Pague e receba na hora" },
  { icon: IconQrcode, label: "QR Code digital", description: "Check-in rápido na entrada" },
  { icon: IconShieldCheck, label: "Compra segura", description: "Reserva garantida por 15 min" },
] as const;

/**
 * Card de oferta de um lote com preço, estoque e botão de compra.
 *
 * @param props.lot - Lote do evento.
 * @param props.isAuthenticated - Altera rótulo do botão se visitante.
 * @param props.onBuy - Callback com ID do lote ao iniciar compra.
 */
function LotOfferCard({
  lot,
  isAuthenticated,
  feePercent,
  onBuy,
}: {
  lot: TicketLot;
  isAuthenticated: boolean;
  feePercent: number;
  onBuy: (lotId: string) => void;
}) {
  const soldOut = lot.availableQuantity === 0;

  return (
    <Box className="lot-offer-card" p="md">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
          <Text fw={700} lineClamp={2} flex={1}>
            {lot.name}
          </Text>
          {soldOut ? (
            <PremiumBadge tone="sold-out" size="xs">
              Esgotado
            </PremiumBadge>
          ) : null}
        </Group>

        <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
          <PremiumBadge tone={soldOut ? "neutral" : "brand"} size="xs">
            {soldOut ? "Sem estoque" : `${lot.availableQuantity} restantes`}
          </PremiumBadge>
          <Stack gap={2} align="flex-end">
            <Text fw={800} size="lg" c="brand" className="lot-offer-card__price">
              {formatLotPrice(lot.price)}
            </Text>
            {lot.price > 0 ? (
              <Text size="xs" c="dimmed">
                (+ taxa{" "}
                {formatCurrencyFromCents(
                  calculatePlatformFeeCents(lot.price, feePercent),
                )}
                )
              </Text>
            ) : null}
          </Stack>
        </Group>

        <Button
          fullWidth
          radius="xl"
          leftSection={<IconTicket size={16} />}
          disabled={soldOut}
          onClick={() => onBuy(lot.id)}
        >
          {soldOut
            ? "Esgotado"
            : !isAuthenticated
              ? lot.price === 0
                ? "Entrar para reservar"
                : "Entrar para comprar"
              : lot.price === 0
                ? "Reservar grátis"
                : "Comprar ingresso"}
        </Button>
      </Stack>
    </Box>
  );
}

/**
 * Exibe hero, informações, lotes disponíveis e link para checkout (autenticado).
 */
export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [participation, setParticipation] = useState<ParticipationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { liked, handleToggleFavorite } = useEventFavoriteAction({
    eventId: event?.id ?? "",
    loginReturnPath: event ? eventPath(event) : undefined,
  });
  const { setParticipationStatus } = useParticipation();
  const feePercent = usePlatformFeePercent();

  const handleParticipationSubmitted = (request: ParticipationRequest) => {
    setParticipation(request);
    setParticipationStatus(
      request.eventId,
      request.status as ParticipationRequestStatus,
    );
  };

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
          preloadEventCoverImage(data.imageUrl);
          if (data.slug && eventId !== data.slug) {
            navigate(eventPath(data), { replace: true });
          }
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
  }, [eventId, navigate]);

  const isPrivate = event?.type === "PRIVATE";

  useEffect(() => {
    if (!event?.id || !isPrivate || !isAuthenticated) {
      setParticipation(null);
      return;
    }

    let cancelled = false;

    participationService
      .getMyParticipationRequest(event.id)
      .then((data) => {
        if (!cancelled) {
          setParticipation(data);
          if (data) {
            setParticipationStatus(
              data.eventId,
              data.status as ParticipationRequestStatus,
            );
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setParticipation(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [event?.id, isPrivate, isAuthenticated, setParticipationStatus]);

  useEventCoverPreload(getEventCoverImageUrl(event ?? {}));

  const eventIsPrivate = event?.type === "PRIVATE";
  const isApproved = participation?.status === "APPROVED";
  const canBuy = !eventIsPrivate || isApproved;
  const purchasableLots = useMemo(() => {
    if (!event) {
      return [];
    }
    if (!eventIsPrivate || !isApproved) {
      return event.ticketLots;
    }
    const allowed = participation?.allowedTicketLotIds;
    if (!allowed) {
      return event.ticketLots;
    }
    return event.ticketLots.filter((lot) => allowed.includes(lot.id));
  }, [
    event,
    eventIsPrivate,
    isApproved,
    participation?.allowedTicketLotIds,
  ]);

  if (loading) {
    return <PageLoader label="Carregando evento..." />;
  }

  if (error || !event) {
    return (
      <Container size="lg" py="md">
        <Stack gap="md">
          <PageBackNav to="/eventos" label="Voltar aos eventos" />
          <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro" radius="lg">
            {error ?? "Evento não encontrado."}
          </Alert>
        </Stack>
      </Container>
    );
  }

  const lowestPrice = getLowestPrice(event);
  const totalAvailable = getTotalAvailable(event);
  const category = inferEventCategory(event);
  const soldOut = totalAvailable === 0;

  const handleBuy = (lotId: string) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: eventPath(event) } });
      return;
    }

    preloadEventCoverImage(event.imageUrl);
    navigate(eventCheckoutPath(event, { lot: lotId }), {
      state: { coverImageUrl: event.imageUrl },
    });
  };

  return (
    <Stack gap={0}>
      <Box className="event-detail-hero full-bleed" style={getEventCoverStyle(event)}>
        <Box className="producer-manage-hero-overlay" />
        <Container size="lg" px="md" className="event-detail-hero-content">
          <Stack gap="md" className="event-detail-hero-info">
            <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
              <Group gap="xs" wrap="wrap" flex={1}>
                <PremiumBadge tone="glass" size="sm" overlay>
                  {CATEGORY_LABELS[category]}
                </PremiumBadge>
                {eventIsPrivate ? <EventPrivateBadge size="sm" overlay /> : null}
              </Group>

              <EventFavoriteButton
                liked={liked}
                size="xl"
                onClick={(clickEvent) => void handleToggleFavorite(clickEvent)}
              />
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
        <Container size="lg" px="md" pt="lg" pb={0}>
          <PageBackNav to="/eventos" label="Voltar aos eventos" />
        </Container>
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

                <Box visibleFrom="md">
                  <AnimatedSection delayMs={120}>
                    <SimpleGrid cols={3} spacing="md">
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
                </Box>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 5 }}>
              <AnimatedSection delayMs={100}>
                <PremiumPaper p="xl" className="event-detail-tickets-panel">
                  <Stack gap="lg">
                    <Stack gap={4}>
                      <Title order={3}>
                        {eventIsPrivate && !canBuy ? "Participação" : "Ingressos"}
                      </Title>
                      <Text size="sm" c="dimmed">
                        {eventIsPrivate && !canBuy
                          ? "Evento privado: sua participação passa pela aprovação do produtor."
                          : "Escolha o lote ideal. Ingressos gratuitos são emitidos na hora; pagos finalizam com PIX ou cartão."}
                      </Text>
                    </Stack>

                    <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                      {lowestPrice !== null ? (
                        <Text fw={800} size="xl" c="brand">
                          {lowestPrice === 0
                            ? "Gratuito"
                            : `a partir de ${formatLotPrice(lowestPrice)}`}
                        </Text>
                      ) : (
                        <Text fw={600} c="dimmed">
                          Sem lotes disponíveis
                        </Text>
                      )}
                      <PremiumBadge tone={soldOut ? "sold-out" : "published"} size="sm">
                        {soldOut
                          ? "Esgotado"
                          : `${totalAvailable} disponíve${totalAvailable === 1 ? "l" : "is"}`}
                      </PremiumBadge>
                    </Group>

                    <Divider />

                    {eventIsPrivate && !canBuy ? (
                      <ParticipationRequestCard
                        event={event}
                        isAuthenticated={isAuthenticated}
                        user={user}
                        request={participation}
                        onSubmitted={handleParticipationSubmitted}
                      />
                    ) : (
                      <>
                        {isApproved ? (
                          <Alert
                            color="green"
                            variant="light"
                            radius="lg"
                            icon={<IconCircleCheck size={18} />}
                            title="Participação aprovada"
                          >
                            Você foi aprovado. Abaixo estão apenas os lotes liberados
                            para você.
                          </Alert>
                        ) : null}

                        {purchasableLots.length === 0 ? (
                          <Box className="empty-state-card" p="xl" style={{ borderRadius: "var(--mantine-radius-lg)" }}>
                            <Stack gap="xs" align="center">
                              <ThemeIcon size={48} radius="xl" variant="light" color="gray">
                                <IconTicket size={24} />
                              </ThemeIcon>
                              <Text fw={600} ta="center">
                                {event.ticketLots.length === 0
                                  ? "Lotes em breve"
                                  : "Nenhum lote liberado"}
                              </Text>
                              <Text size="sm" c="dimmed" ta="center">
                                {event.ticketLots.length === 0
                                  ? "Este evento ainda não possui lotes de ingressos publicados."
                                  : "Sua aprovação não inclui lotes disponíveis no momento. Fale com o produtor."}
                              </Text>
                            </Stack>
                          </Box>
                        ) : (
                          <Stack gap="sm">
                            {purchasableLots.map((lot) => (
                              <LotOfferCard
                                key={lot.id}
                                lot={lot}
                                isAuthenticated={isAuthenticated}
                                feePercent={feePercent}
                                onBuy={handleBuy}
                              />
                            ))}
                          </Stack>
                        )}

                        {!isAuthenticated && !eventIsPrivate ? (
                          <Text size="sm" c="dimmed" ta="center">
                            <Link to="/login" state={{ from: eventPath(event) }}>
                              Faça login
                            </Link>{" "}
                            ou <Link to="/cadastro">cadastre-se</Link> para reservar.
                          </Text>
                        ) : null}
                      </>
                    )}
                  </Stack>
                </PremiumPaper>
              </AnimatedSection>
            </Grid.Col>

            <Grid.Col span={12} hiddenFrom="md">
              <AnimatedSection delayMs={120}>
                <SimpleGrid cols={1} spacing="md">
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
            </Grid.Col>
          </Grid>
        </Container>

        <SiteFooter />
      </Box>
    </Stack>
  );
}
