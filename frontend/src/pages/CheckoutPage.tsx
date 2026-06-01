/**
 * @file Fluxo de checkout: reserva, polling de fase, PIX e simulação em dev.
 * @module pages/CheckoutPage
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Alert,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Group,
  Loader,
  NumberInput,
  Stack,
  Stepper,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCalendar,
  IconCheck,
  IconClock,
  IconMapPin,
  IconShieldCheck,
  IconShoppingCart,
  IconTicket,
  IconX,
} from "@tabler/icons-react";
import { AnimatedSection } from "../components/home/AnimatedSection";
import { BackButton } from "../components/account/BackButton";
import { PageLoader } from "../components/account/PageLoader";
import { PremiumPaper } from "../components/account/PremiumPaper";
import { DevSimulatePaymentPanel, PixPaymentPanel } from "../components/PixPaymentPanel";
import { PhaseBadge } from "../components/PhaseBadge";
import { useReservationPoller } from "../hooks/useReservationPoller";
import * as eventService from "../features/catalog/api/eventService";
import * as purchaseService from "../features/sales/api/purchaseService";
import type { Event, TicketLot } from "../types/api";
import { getEventCoverStyle } from "../utils/eventVisuals";
import { formatCurrencyFromCents, formatEventDateOnly, formatEventTimeOnly } from "../utils/format";
import { getApiErrorMessage } from "../utils/errors";
import {
  getBillableQuantity,
  getQuantityValidationMessage,
  normalizeTicketQuantity,
  validateTicketQuantity,
} from "../utils/ticketQuantity";

/** Mapeia fase da reserva para índice do stepper Mantine (0–4). */
function getActiveStep(phase: string | undefined): number {
  switch (phase) {
    case "PENDING_PERSISTENCE":
      return 1;
    case "PENDING_PAYMENT":
      return 2;
    case "AWAITING_PAYMENT":
      return 3;
    case "PAID":
      return 4;
    default:
      return 0;
  }
}

/** Linha label/valor no painel lateral de resumo do checkout. */
function CheckoutSummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={600} ta="right">
        {value}
      </Text>
    </Group>
  );
}

/**
 * Painel fixo com resumo do evento, lote, quantidade e total da compra.
 */
function CheckoutOrderSummary({
  event,
  selectedLot,
  quantity,
  totalCents,
  quantityWarning,
}: {
  event: Event;
  selectedLot: TicketLot;
  quantity: number;
  totalCents: number;
  quantityWarning?: string | null;
}) {
  return (
    <PremiumPaper p="xl" className="checkout-summary-panel">
      <Stack gap="lg">
        <Stack gap="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            Resumo do pedido
          </Text>
          <Title order={3} size="h4" lineClamp={2} style={{ letterSpacing: "-0.01em" }}>
            {event.title}
          </Title>
        </Stack>

        <Box
          className="checkout-summary-cover"
          style={getEventCoverStyle(event)}
          aria-hidden
        />

        <Stack gap="sm">
          <CheckoutSummaryRow label="Lote" value={selectedLot.name} />
          <CheckoutSummaryRow
            label="Quantidade"
            value={`${quantity} ingresso${quantity === 1 ? "" : "s"}`}
          />
          <CheckoutSummaryRow
            label="Unitário"
            value={formatCurrencyFromCents(selectedLot.price)}
          />
          <CheckoutSummaryRow
            label="Data"
            value={`${formatEventDateOnly(event.date)} · ${formatEventTimeOnly(event.date)}`}
          />
          <CheckoutSummaryRow label="Local" value={event.location} />
        </Stack>

        <Divider />

        <Group justify="space-between" align="center">
          <Text fw={700} size="lg">
            Total
          </Text>
          <Text
            fw={800}
            className="order-total-value"
            c={quantityWarning ? "dimmed" : "brand"}
          >
            {formatCurrencyFromCents(totalCents)}
          </Text>
        </Group>

        {quantityWarning ? (
          <Alert color="orange" variant="light" radius="lg" icon={<IconAlertCircle size={18} />}>
            {quantityWarning}
          </Alert>
        ) : null}

        <Group gap={6} c="dimmed">
          <IconShieldCheck size={16} />
          <Text size="sm">Reserva garantida por 15 minutos após confirmar.</Text>
        </Group>
      </Stack>
    </PremiumPaper>
  );
}

/**
 * Stepper de compra com seleção de lote/quantidade, reserva e pagamento PIX monitorado.
 */
export function CheckoutPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();

  const lotIdFromQuery = searchParams.get("lot") ?? "";
  const reservationFromQuery = searchParams.get("reservation");

  const [event, setEvent] = useState<Event | null>(null);
  const [selectedLot, setSelectedLot] = useState<TicketLot | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);

  const [reservationId, setReservationId] = useState<string | null>(
    () => reservationFromQuery,
  );
  const [reserving, setReserving] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  const { status, loading: polling, error: pollError } = useReservationPoller({
    reservationId,
    enabled: Boolean(reservationId),
    stopOn: confirmingPayment
      ? purchaseService.TERMINAL_PHASES
      : purchaseService.CHECKOUT_POLL_STOP_PHASES,
  });

  useEffect(() => {
    if (!eventId) {
      setEventError("Evento inválido.");
      setLoadingEvent(false);
      return;
    }

    let cancelled = false;

    eventService
      .getPublishedEvent(eventId)
      .then((data) => {
        if (cancelled) {
          return;
        }

        setEvent(data);

        const lot =
          data.ticketLots.find((item) => item.id === lotIdFromQuery) ??
          data.ticketLots[0] ??
          null;

        setSelectedLot(lot);
      })
      .catch((err) => {
        if (!cancelled) {
          setEventError(getApiErrorMessage(err, "Evento não encontrado."));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingEvent(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, lotIdFromQuery]);

  useEffect(() => {
    if (reservationFromQuery) {
      setReservationId(reservationFromQuery);
    }
  }, [reservationFromQuery]);

  const quantityValidation = useMemo(() => {
    if (!selectedLot) {
      return null;
    }

    return validateTicketQuantity(quantity, selectedLot.availableQuantity);
  }, [selectedLot, quantity]);

  const quantityWarning = useMemo(() => {
    if (!quantityValidation || quantityValidation.valid) {
      return null;
    }

    return getQuantityValidationMessage(quantityValidation);
  }, [quantityValidation]);

  const billableQuantity = useMemo(() => {
    if (!quantityValidation) {
      return quantity;
    }

    return getBillableQuantity(quantityValidation);
  }, [quantityValidation, quantity]);

  const totalCents = useMemo(() => {
    if (!selectedLot) {
      return 0;
    }
    return selectedLot.price * billableQuantity;
  }, [selectedLot, billableQuantity]);

  const handleReserve = async () => {
    if (!selectedLot || !quantityValidation) {
      return;
    }

    if (!quantityValidation.valid) {
      notifications.show({
        title: "Quantidade inválida",
        message: getQuantityValidationMessage(quantityValidation),
        color: "orange",
        icon: <IconAlertCircle size={18} />,
      });
      return;
    }

    setReserving(true);

    try {
      const response = await purchaseService.reserveTickets(
        selectedLot.id,
        quantityValidation.quantity,
      );
      setReservationId(response.reservation.id);

      notifications.show({
        title: "Reserva criada",
        message: "Aguarde enquanto geramos seu PIX.",
        color: "green",
        icon: <IconCheck size={18} />,
      });
    } catch (error) {
      notifications.show({
        title: "Não foi possível reservar",
        message: getApiErrorMessage(error, "Tente novamente."),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setReserving(false);
    }
  };

  const handleSimulatePayment = async () => {
    const orderId = status?.order?.id;
    if (!orderId) {
      return;
    }

    setSimulating(true);
    setConfirmingPayment(true);

    try {
      await purchaseService.simulateDevPayment(orderId);
      notifications.show({
        title: "Pagamento simulado",
        message: "Aguardando confirmação...",
        color: "blue",
      });
    } catch (error) {
      notifications.show({
        title: "Falha ao simular pagamento",
        message: getApiErrorMessage(error),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setSimulating(false);
    }
  };

  if (loadingEvent) {
    return <PageLoader label="Preparando checkout..." />;
  }

  if (eventError || !event || !selectedLot) {
    return (
      <Container size="lg" py="md">
        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro" radius="lg">
          {eventError ?? "Lote não encontrado."}
        </Alert>
      </Container>
    );
  }

  const phase = status?.phase;
  const isCheckoutStarted = Boolean(reservationId);
  const isPaid = phase === "PAID";
  const isFailed = phase === "EXPIRED" || phase === "FAILED";

  return (
    <Stack gap={0}>
      <Box className="checkout-hero full-bleed" style={getEventCoverStyle(event)}>
        <Box className="producer-manage-hero-overlay" />
        <Container size="lg" px="md" className="checkout-hero-content">
          <Stack gap="sm" maw={640}>
              <Badge
                color="white"
                c="dark"
                variant="filled"
                radius="md"
                size="lg"
                w="fit-content"
                tt="uppercase"
                fw={700}
                className="checkout-secure-badge"
                leftSection={<IconShieldCheck size={14} stroke={2.25} />}
              >
                Checkout seguro
              </Badge>
              <Title
                order={1}
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  lineHeight: 1.12,
                  letterSpacing: "-0.02em",
                }}
              >
                Finalizar compra
              </Title>
              <Group gap="lg" wrap="wrap" c="white" opacity={0.92}>
                <Group gap={6}>
                  <IconTicket size={18} />
                  <Text size="sm" fw={500}>
                    {selectedLot.name}
                  </Text>
                </Group>
                <Group gap={6}>
                  <IconCalendar size={18} />
                  <Text size="sm" fw={500}>
                    {formatEventDateOnly(event.date)}
                  </Text>
                </Group>
                <Group gap={6}>
                  <IconMapPin size={18} />
                  <Text size="sm" fw={500} lineClamp={1}>
                    {event.location}
                  </Text>
                </Group>
              </Group>
          </Stack>
        </Container>
      </Box>

      <Box className="checkout-body">
        <Container size="lg" py="xl" px="md">
          <BackButton to={`/eventos/${event.id}`} label="Voltar ao evento" />
          <Grid gap="xl" mt="lg">
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Stack gap="lg">
                {!isCheckoutStarted ? (
                  <AnimatedSection>
                    <PremiumPaper p="xl">
                      <Stack gap="lg">
                        <Group gap="sm" className="producer-form-section-title">
                          <ThemeIcon size={40} radius="md" variant="light" color="brand">
                            <IconShoppingCart size={20} />
                          </ThemeIcon>
                          <Stack gap={2}>
                            <Title order={3} size="h4" className="producer-section-title">
                              Reservar ingressos
                            </Title>
                            <Text size="sm" c="dimmed">
                              Escolha a quantidade e confirme para gerar o PIX.
                            </Text>
                          </Stack>
                        </Group>

                        <Group grow align="flex-start" wrap="wrap">
                          <Box className="checkout-metric-block">
                            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={6}>
                              Disponíveis
                            </Text>
                            <Text fw={800} size="lg">
                              {selectedLot.availableQuantity}
                            </Text>
                          </Box>
                          <Box className="checkout-metric-block">
                            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={6}>
                              Preço unitário
                            </Text>
                            <Text fw={800} size="lg" c="brand">
                              {formatCurrencyFromCents(selectedLot.price)}
                            </Text>
                          </Box>
                        </Group>

                        <NumberInput
                          label="Quantidade"
                          description={`Máximo de ${selectedLot.availableQuantity} ingresso${selectedLot.availableQuantity === 1 ? "" : "s"} neste lote.`}
                          min={1}
                          max={selectedLot.availableQuantity}
                          value={quantity}
                          onChange={(value) => {
                            if (value === "" || value === undefined) {
                              setQuantity(1);
                              return;
                            }
                            setQuantity(normalizeTicketQuantity(value));
                          }}
                          error={
                            quantityValidation && !quantityValidation.valid
                              ? getQuantityValidationMessage(quantityValidation)
                              : undefined
                          }
                          radius="md"
                        />

                        {quantityWarning ? (
                          <Alert
                            color="orange"
                            variant="light"
                            radius="lg"
                            icon={<IconAlertCircle size={18} />}
                          >
                            {quantityWarning}
                          </Alert>
                        ) : null}

                        <Button
                          size="lg"
                          radius="xl"
                          leftSection={<IconShoppingCart size={18} />}
                          loading={reserving}
                          disabled={
                            selectedLot.availableQuantity === 0 ||
                            Boolean(quantityValidation && !quantityValidation.valid)
                          }
                          onClick={() => void handleReserve()}
                        >
                          Reservar ingressos
                        </Button>

                        <Group gap={6} c="dimmed">
                          <IconClock size={16} />
                          <Text size="sm">
                            Após reservar, você terá <strong>15 minutos</strong> para pagar via PIX.
                          </Text>
                        </Group>
                      </Stack>
                    </PremiumPaper>
                  </AnimatedSection>
                ) : (
                  <AnimatedSection>
                    <Stack gap="lg">
                      <PremiumPaper p="xl">
                        <Stack gap="lg">
                          <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
                            <Stack gap={4}>
                              <Title order={3} size="h4" className="producer-section-title">
                                Status da compra
                              </Title>
                              <Text size="sm" c="dimmed">
                                Acompanhe cada etapa até a emissão dos ingressos.
                              </Text>
                            </Stack>
                            {phase ? <PhaseBadge phase={phase} /> : null}
                          </Group>

                          <Stepper
                            active={getActiveStep(phase)}
                            size="sm"
                            allowNextStepsSelect={false}
                            className="checkout-stepper"
                          >
                            <Stepper.Step label="Reserva" description="Confirmada" />
                            <Stepper.Step label="Processamento" description="Persistência" />
                            <Stepper.Step label="PIX" description="Aguardando" />
                            <Stepper.Step label="Concluído" description="Ingressos" />
                          </Stepper>

                          {polling ? (
                            <Group gap="sm" className="checkout-status-loading">
                              <Loader size="sm" color="brand" />
                              <Text size="sm" c="dimmed">
                                Atualizando status...
                              </Text>
                            </Group>
                          ) : null}

                          {pollError ? (
                            <Alert color="red" icon={<IconAlertCircle size={18} />} radius="lg">
                              {pollError}
                            </Alert>
                          ) : null}
                        </Stack>
                      </PremiumPaper>

                      {phase === "AWAITING_PAYMENT" && status?.payment ? (
                        <>
                          <PixPaymentPanel
                            pixCopyPaste={status.payment.pixCopyPaste}
                            amountCents={status.payment.amountCents}
                            expiresAt={status.payment.expiresAt}
                          />
                          {import.meta.env.DEV ? (
                            <DevSimulatePaymentPanel
                              loading={simulating}
                              onSimulate={() => void handleSimulatePayment()}
                            />
                          ) : null}
                        </>
                      ) : null}

                      {isPaid ? (
                        <PremiumPaper p="xl" className="checkout-success-panel">
                          <Stack gap="md" align="center" ta="center">
                            <ThemeIcon size={64} radius="xl" variant="light" color="green">
                              <IconCheck size={32} />
                            </ThemeIcon>
                            <Stack gap={4}>
                              <Title order={3}>Pagamento confirmado!</Title>
                              <Text c="dimmed">
                                Seus ingressos foram emitidos com sucesso e já estão disponíveis.
                              </Text>
                            </Stack>
                            <Button
                              component={Link}
                              to="/ingressos"
                              radius="xl"
                              size="md"
                              leftSection={<IconTicket size={18} />}
                            >
                              Ver meus ingressos
                            </Button>
                          </Stack>
                        </PremiumPaper>
                      ) : null}

                      {isFailed ? (
                        <PremiumPaper p="xl" className="checkout-error-panel">
                          <Stack gap="md" align="center" ta="center">
                            <ThemeIcon size={64} radius="xl" variant="light" color="red">
                              <IconAlertCircle size={32} />
                            </ThemeIcon>
                            <Stack gap={4}>
                              <Title order={3}>Compra não concluída</Title>
                              <Text c="dimmed">
                                A reserva expirou ou o pagamento falhou. Você pode tentar novamente.
                              </Text>
                            </Stack>
                            <Group gap="sm">
                              <Button
                                radius="xl"
                                onClick={() => {
                                  setReservationId(null);
                                  setConfirmingPayment(false);
                                }}
                              >
                                Tentar novamente
                              </Button>
                              <Button
                                variant="subtle"
                                component={Link}
                                to={`/eventos/${event.id}`}
                                radius="xl"
                              >
                                Voltar ao evento
                              </Button>
                            </Group>
                          </Stack>
                        </PremiumPaper>
                      ) : null}

                      {!isPaid && !isFailed ? (
                        <Group>
                          <Button
                            variant="subtle"
                            component={Link}
                            to={`/eventos/${event.id}`}
                            radius="xl"
                          >
                            Voltar ao evento
                          </Button>
                        </Group>
                      ) : null}
                    </Stack>
                  </AnimatedSection>
                )}
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 5 }}>
              <AnimatedSection delayMs={80}>
                <Box className="checkout-summary-sticky">
                  <CheckoutOrderSummary
                    event={event}
                    selectedLot={selectedLot}
                    quantity={quantity}
                    totalCents={totalCents}
                    quantityWarning={quantityWarning}
                  />
                </Box>
              </AnimatedSection>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>
    </Stack>
  );
}
