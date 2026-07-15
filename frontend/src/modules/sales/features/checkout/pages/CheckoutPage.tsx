/**
 * @file Fluxo de checkout: reserva, polling de fase, pagamento e simulação em dev.
 * @module pages/CheckoutPage
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Group,
  Loader,
  Modal,
  NumberInput,
  SegmentedControl,
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
  IconCreditCard,
  IconMapPin,
  IconQrcode,
  IconReceipt,
  IconShieldCheck,
  IconShoppingCart,
  IconTicket,
  IconX,
} from "@tabler/icons-react";
import { AnimatedSection } from "@/shared/components/AnimatedSection";
import { EventCoverHero } from "@/modules/catalog/features/browse/components/EventCoverHero";
import { PageBackNav } from "@/shared/components/PageBackNav";
import { PageLoader } from "@/shared/components/PageLoader";
import { PremiumPaper } from "@/shared/components/PremiumPaper";
import {
  DevSimulatePaymentPanel,
  PixPaymentPanel,
  PixPaymentSkeleton,
} from "@/modules/sales/features/checkout/components/PixPaymentPanel";
import { CardPaymentPanel } from "@/modules/sales/features/checkout/components/CardPaymentPanel";
import { PhaseBadge } from "@/modules/sales/features/checkout/components/PhaseBadge";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import { useAuth } from "@/modules/identity/features/auth/context/AuthContext";
import { useEventCoverPreload } from "@/modules/catalog/features/browse/hooks/useEventCoverPreload";
import { useReservationPoller } from "@/modules/sales/features/checkout/hooks/useReservationPoller";
import * as eventService from "@/modules/catalog/api/eventService";
import * as purchaseService from "@/modules/sales/api/purchaseService";
import type { Event, ReservationPhase, ReservationStatusView, TicketLot } from "@/shared/types/api";
import {
  getEventCoverImageUrl,
  getEventCoverStyle,
  preloadEventCoverImage,
} from "@/modules/catalog/utils/eventVisuals";
import { eventPath } from "@/modules/catalog/utils/eventPaths";
import { formatCurrencyFromCents, formatEventDateOnly, formatEventTimeOnly, formatLotPrice } from "@/shared/utils/format";
import { calculateOrderTotalWithPlatformFee } from "@/shared/utils/platformFee";
import { usePlatformFeePercent } from "@/shared/hooks/usePlatformFeePercent";
import { getApiErrorCode, getApiErrorMessage } from "@/shared/utils/errors";
import {
  getBillableQuantity,
  getQuantityValidationMessage,
  normalizeTicketQuantity,
  validateTicketQuantity,
} from "@/modules/sales/features/checkout/utils/ticketQuantity";

interface CheckoutLocationState {
  coverImageUrl?: string | null;
}

/** Descrição do passo de pagamento no stepper conforme a fase atual. */
function getPaymentStepDescription(phase: string | undefined): string {
  switch (phase) {
    case "PENDING_PAYMENT":
      return "Escolha";
    case "AWAITING_PAYMENT":
      return "Aguardando";
    case "PAID":
      return "Concluído";
    default:
      return "Aguardando";
  }
}

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

/** Cabeçalho e stepper compartilhados entre fluxo ativo e tela de conclusão. */
function CheckoutStatusStepper({
  phase,
  polling,
  pollError,
}: {
  phase: ReservationPhase | undefined;
  polling: boolean;
  pollError: string | null;
}) {
  return (
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
        <Box className="checkout-phase-slot">
          {phase ? <PhaseBadge phase={phase} /> : null}
        </Box>
      </Group>

      <Stepper
        active={getActiveStep(phase)}
        size="sm"
        allowNextStepsSelect={false}
        className="checkout-stepper"
      >
        <Stepper.Step label="Reserva" description="Confirmada" />
        <Stepper.Step label="Processamento" description="Persistência" />
        <Stepper.Step
          label="Pagamento"
          description={getPaymentStepDescription(phase)}
        />
        <Stepper.Step label="Concluído" description="Ingressos" />
      </Stepper>

      <Box
        className={`checkout-status-loading${polling ? " is-active" : ""}`}
        aria-hidden={!polling}
      >
        <Group gap="sm">
          <Loader size="sm" color="brand" />
          <Text size="sm" c="dimmed">
            Atualizando status...
          </Text>
        </Group>
      </Box>

      {pollError ? (
        <Alert color="red" icon={<IconAlertCircle size={18} />} radius="lg">
          {pollError}
        </Alert>
      ) : null}
    </Stack>
  );
}

function CheckoutPaymentProgressPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <PremiumPaper p="xl" className="checkout-progress-panel" aria-busy="true">
      <Stack gap="lg" align="center" py="md">
        <Loader size="md" color="brand" />
        <Stack gap={4} align="center" ta="center" maw={420}>
          <Text fw={700}>{title}</Text>
          <Text size="sm" c="dimmed" style={{ lineHeight: 1.55 }}>
            {description}
          </Text>
        </Stack>
      </Stack>
    </PremiumPaper>
  );
}

function CheckoutSuccessContent({
  eventHref,
  isFree,
}: {
  eventHref: string;
  isFree?: boolean;
}) {
  return (
    <Stack gap="md" align="center" ta="center" className="checkout-result-content">
      <ThemeIcon size={64} radius="xl" variant="light" color="green">
        <IconCheck size={32} />
      </ThemeIcon>
      <Stack gap={4}>
        <Title order={3}>
          {isFree ? "Ingressos garantidos!" : "Pagamento confirmado!"}
        </Title>
        <Text c="dimmed">
          {isFree
            ? "Seu ingresso gratuito foi emitido e já está disponível na carteira."
            : "Seus ingressos foram emitidos com sucesso e já estão disponíveis."}
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
      <Button
        variant="subtle"
        component={Link}
        to={eventHref}
        radius="xl"
        size="sm"
      >
        Voltar ao evento
      </Button>
    </Stack>
  );
}

function CheckoutErrorContent({
  eventHref,
  onRetry,
}: {
  eventHref: string;
  onRetry: () => void;
}) {
  return (
    <Stack gap="md" align="center" ta="center" className="checkout-result-content">
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
        <Button radius="xl" onClick={onRetry}>
          Tentar novamente
        </Button>
        <Button variant="subtle" component={Link} to={eventHref} radius="xl">
          Voltar ao evento
        </Button>
      </Group>
    </Stack>
  );
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
  subtotalCents,
  platformFeeCents,
  totalCents,
  quantityWarning,
}: {
  event: Event;
  selectedLot: TicketLot;
  quantity: number;
  subtotalCents: number;
  platformFeeCents: number;
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
            value={formatLotPrice(selectedLot.price)}
          />
          <CheckoutSummaryRow
            label="Subtotal"
            value={formatLotPrice(subtotalCents)}
          />
          {platformFeeCents > 0 ? (
            <CheckoutSummaryRow
              label="Taxa de serviço"
              value={formatCurrencyFromCents(platformFeeCents)}
            />
          ) : null}
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
            {formatLotPrice(totalCents)}
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
 * Stepper de compra com seleção de lote/quantidade, reserva e pagamento monitorado.
 */
export function CheckoutPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const coverImageFromNavigation = (location.state as CheckoutLocationState | null)
    ?.coverImageUrl;

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
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("card");
  const [cardSubmitting, setCardSubmitting] = useState(false);
  const [pixGenerating, setPixGenerating] = useState(false);
  const [pixGenerateError, setPixGenerateError] = useState<string | null>(null);
  const feePercent = usePlatformFeePercent();
  const [pendingOrderModalOpen, setPendingOrderModalOpen] = useState(false);

  const { user } = useAuth();

  const pollContextRef = useRef({
    paymentMethod: "card" as "pix" | "card",
    confirmingPayment: false,
    isFreeOrder: false,
  });

  const didAutoSelectPixRef = useRef(false);

  const shouldContinuePolling = useCallback(
    (phase: ReservationStatusView["phase"]) => {
      if (purchaseService.TERMINAL_PHASES.has(phase)) {
        return false;
      }

      const {
        paymentMethod: method,
        confirmingPayment: confirming,
        isFreeOrder: free,
      } = pollContextRef.current;

      if (confirming || free) {
        return true;
      }

      if (phase === "PENDING_PAYMENT") {
        return false;
      }

      if (phase === "AWAITING_PAYMENT") {
        return method === "pix";
      }

      return phase === "PENDING_PERSISTENCE";
    },
    [],
  );

  const { status, loading: polling, error: pollError, refresh } = useReservationPoller({
    reservationId,
    enabled: Boolean(reservationId),
    shouldContinuePolling,
  });

  pollContextRef.current = {
    paymentMethod,
    confirmingPayment,
    isFreeOrder:
      selectedLot?.price === 0 || status?.order?.totalPrice === 0,
  };

  useEventCoverPreload(coverImageFromNavigation ?? getEventCoverImageUrl(event ?? {}));

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
        preloadEventCoverImage(data.imageUrl);

        if (data.slug && eventId !== data.slug) {
          const next = `${eventPath(data)}/comprar${location.search}`;
          navigate(next, { replace: true, state: location.state });
        }

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
  }, [eventId, lotIdFromQuery, location.search, location.state, navigate]);

  useEffect(() => {
    if (reservationFromQuery) {
      setReservationId(reservationFromQuery);
    }
  }, [reservationFromQuery]);

  useEffect(() => {
    if (
      !didAutoSelectPixRef.current &&
      status?.phase === "AWAITING_PAYMENT" &&
      status.payment
    ) {
      didAutoSelectPixRef.current = true;
      setPaymentMethod("pix");
      pollContextRef.current = {
        paymentMethod: "pix",
        confirmingPayment: pollContextRef.current.confirmingPayment,
        isFreeOrder: pollContextRef.current.isFreeOrder,
      };
    }
  }, [status?.phase, status?.payment]);

  useEffect(() => {
    const currentPhase = status?.phase;
    if (currentPhase === "PAID" || currentPhase === "EXPIRED" || currentPhase === "FAILED") {
      setConfirmingPayment(false);
    }
  }, [status?.phase]);

  const generatePix = async (orderId: string) => {
    if (pixGenerating) {
      return;
    }

    setPixGenerating(true);
    setPixGenerateError(null);

    try {
      await purchaseService.createPixPayment(orderId);
      await refresh();
    } catch (error) {
      setPixGenerateError(getApiErrorMessage(error, "Não foi possível gerar o PIX."));
    } finally {
      setPixGenerating(false);
    }
  };

  const handlePaymentMethodChange = (value: string) => {
    const method = value as "pix" | "card";
    setPaymentMethod(method);
    pollContextRef.current = {
      paymentMethod: method,
      confirmingPayment,
      isFreeOrder: pollContextRef.current.isFreeOrder,
    };
    setPixGenerateError(null);

    if (
      method === "pix" &&
      status?.order?.id &&
      status.phase === "PENDING_PAYMENT" &&
      !pixGenerating
    ) {
      void generatePix(status.order.id);
    } else if (
      method === "pix" &&
      status?.phase === "AWAITING_PAYMENT" &&
      status.payment
    ) {
      void refresh();
    }
  };

  const quantityValidation = useMemo(() => {
    if (!selectedLot) {
      return null;
    }

    const maxByDocument =
      selectedLot.maxPerDocument != null && selectedLot.maxPerDocument > 0
        ? selectedLot.maxPerDocument
        : selectedLot.availableQuantity;
    const maxAvailable = Math.min(selectedLot.availableQuantity, maxByDocument);

    return validateTicketQuantity(quantity, maxAvailable);
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

  const subtotalCents = useMemo(() => {
    if (!selectedLot) {
      return 0;
    }
    return selectedLot.price * billableQuantity;
  }, [selectedLot, billableQuantity]);

  const pricing = useMemo(() => {
    const order = status?.order;
    if (order && typeof order.totalPrice === "number") {
      const platformFeeCents = order.platformFeeCents ?? 0;
      return {
        subtotalCents: order.totalPrice - platformFeeCents,
        platformFeeCents,
        totalCents: order.totalPrice,
      };
    }

    return calculateOrderTotalWithPlatformFee(subtotalCents, feePercent);
  }, [status?.order, subtotalCents, feePercent]);

  const totalCents = pricing.totalCents;

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
        message: "Aguarde enquanto preparamos seu pedido.",
        color: "green",
        icon: <IconCheck size={18} />,
      });
    } catch (error) {
      const errorCode = getApiErrorCode(error);
      const isParticipationBlocked = errorCode === "PARTICIPATION_NOT_APPROVED";
      const isPendingOrderBlocked = errorCode === "PENDING_ORDER_EXISTS";

      if (isPendingOrderBlocked) {
        setPendingOrderModalOpen(true);
        return;
      }

      notifications.show({
        title: isParticipationBlocked ? "Participação pendente" : "Não foi possível reservar",
        message: isParticipationBlocked
          ? "Este evento é privado. Sua solicitação de participação precisa ser aprovada antes da compra."
          : getApiErrorMessage(error, "Tente novamente."),
        color: isParticipationBlocked ? "orange" : "red",
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
    pollContextRef.current = {
      paymentMethod,
      confirmingPayment: true,
      isFreeOrder: pollContextRef.current.isFreeOrder,
    };

    try {
      await purchaseService.simulateDevPayment(orderId);
      await refresh();
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

  const handleCardPayment = async (
    payload: Omit<purchaseService.CardPaymentPayload, "orderId">,
  ) => {
    const orderId = status?.order?.id;
    if (!orderId) {
      return;
    }

    setCardSubmitting(true);

    try {
      const result = await purchaseService.payWithCard({ orderId, ...payload });

      if (result.status === "approved") {
        setConfirmingPayment(true);
        pollContextRef.current = {
          paymentMethod,
          confirmingPayment: true,
          isFreeOrder: pollContextRef.current.isFreeOrder,
        };
        await refresh();
        notifications.show({
          title: "Pagamento aprovado",
          message: "Emitindo seus ingressos...",
          color: "green",
          icon: <IconCheck size={18} />,
        });
      } else if (result.status === "pending") {
        setConfirmingPayment(true);
        pollContextRef.current = {
          paymentMethod,
          confirmingPayment: true,
          isFreeOrder: pollContextRef.current.isFreeOrder,
        };
        await refresh();
        notifications.show({
          title: "Pagamento em análise",
          message: "Assim que for aprovado, seus ingressos serão emitidos.",
          color: "blue",
        });
      } else {
        notifications.show({
          title: "Pagamento recusado",
          message:
            "Revise os dados do cartão ou tente outro meio de pagamento.",
          color: "red",
          icon: <IconX size={18} />,
        });
      }
    } catch (error) {
      notifications.show({
        title: "Falha no pagamento",
        message: getApiErrorMessage(error, "Tente novamente."),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setCardSubmitting(false);
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
  const isCheckoutStarted = Boolean(reservationId) || reserving;
  const isPaid = phase === "PAID";
  const isFailed = phase === "EXPIRED" || phase === "FAILED";
  const isPendingPersistence = phase === "PENDING_PERSISTENCE";
  const isPaymentPending = phase === "PENDING_PAYMENT";
  const isPixReady = phase === "AWAITING_PAYMENT" && Boolean(status?.payment);
  const canChoosePayment = isPaymentPending || isPixReady;
  const orderAmountCents = status?.order?.totalPrice ?? totalCents;
  const isFreeOrder = orderAmountCents === 0;
  const isAwaitingCardReview =
    phase === "AWAITING_PAYMENT" && !status?.payment && confirmingPayment;
  const showPaymentForm =
    canChoosePayment && !confirmingPayment && !cardSubmitting && !isFreeOrder;
  const showCompletionState = isPaid || isFailed;

  const paymentProgressCopy = isFreeOrder
    ? {
        title: "Emitindo ingresso gratuito",
        description:
          "Sua reserva gratuita foi confirmada. Estamos gerando o ingresso — isso leva só alguns segundos.",
      }
    : cardSubmitting
      ? {
          title: "Processando pagamento...",
          description:
            "Estamos validando os dados do cartão com segurança. Não feche esta página.",
        }
      : isAwaitingCardReview
        ? {
            title: "Pagamento em análise",
            description:
              "Recebemos seu pagamento e estamos aguardando a confirmação. Seus ingressos serão emitidos assim que for aprovado.",
          }
        : isPendingPersistence
          ? {
              title: "Emitindo seus ingressos",
              description:
                "Pagamento confirmado. Estamos gerando seus ingressos — isso leva só alguns segundos.",
            }
          : {
              title: "Finalizando compra",
              description:
                "Pagamento recebido. Aguarde enquanto concluímos a emissão dos ingressos.",
            };

  const showPaymentProgress =
    !showCompletionState &&
    (isFreeOrder
      ? isCheckoutStarted && (isPendingPersistence || isPaymentPending || polling)
      : (cardSubmitting || confirmingPayment || isAwaitingCardReview) &&
        !showPaymentForm);

  const handleCheckoutRetry = () => {
    setReservationId(null);
    setConfirmingPayment(false);
    setPaymentMethod("card");
    setPixGenerateError(null);
  };

  return (
    <>
    <Stack gap={0}>
      <EventCoverHero source={event} className="checkout-hero full-bleed" priority>
        <Box className="producer-manage-hero-overlay" />
        <Container size="lg" px="md" className="checkout-hero-content">
          <Stack gap="sm" maw={640}>
              <PremiumBadge
                tone="glass"
                size="md"
                overlay
                icon={<IconShieldCheck size={13} stroke={2.25} />}
                className="checkout-secure-badge"
              >
                Checkout seguro
              </PremiumBadge>
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
      </EventCoverHero>

      <Box className="checkout-body page-body">
        <Container size="lg" py="xl" px="md">
          <PageBackNav to={eventPath(event)} label="Voltar ao evento" />
          <Grid gap="xl" mt="lg">
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Stack gap="lg">
                {!isCheckoutStarted ? (
                  <AnimatedSection animate={false}>
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
                              Escolha a quantidade e confirme para reservar.
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
                              {formatLotPrice(selectedLot.price)}
                            </Text>
                            {selectedLot.price > 0 ? (
                              <Text size="xs" c="dimmed" mt={4}>
                                (+ taxa{" "}
                                {formatCurrencyFromCents(
                                  calculateOrderTotalWithPlatformFee(
                                    selectedLot.price,
                                    feePercent,
                                  ).platformFeeCents,
                                )}
                                )
                              </Text>
                            ) : null}
                          </Box>
                        </Group>

                        <NumberInput
                          label="Quantidade"
                          description={
                            selectedLot.maxPerDocument === 1
                              ? "Este lote permite apenas 1 ingresso por CPF."
                              : `Máximo de ${quantityValidation?.maxAvailable ?? selectedLot.availableQuantity} ingresso${(quantityValidation?.maxAvailable ?? selectedLot.availableQuantity) === 1 ? "" : "s"} neste lote.`
                          }
                          min={1}
                          max={
                            quantityValidation?.maxAvailable ??
                            selectedLot.availableQuantity
                          }
                          disabled={selectedLot.maxPerDocument === 1}
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
                          {isFreeOrder || selectedLot.price === 0
                            ? "Reservar grátis"
                            : "Reservar ingressos"}
                        </Button>

                        <Group gap={6} c="dimmed">
                          <IconClock size={16} />
                          <Text size="sm">
                            {selectedLot.price === 0 ? (
                              <>
                                Ingresso gratuito: após reservar, a emissão é{" "}
                                <strong>automática</strong>.
                              </>
                            ) : (
                              <>
                                Após reservar, você terá <strong>15 minutos</strong> para
                                concluir o pagamento.
                              </>
                            )}
                          </Text>
                        </Group>
                      </Stack>
                    </PremiumPaper>
                  </AnimatedSection>
                ) : (
                  <AnimatedSection animate={false}>
                    <Stack gap="lg" className="checkout-flow">
                      {showCompletionState ? (
                        <PremiumPaper
                          p="xl"
                          className={isPaid ? "checkout-success-panel" : "checkout-error-panel"}
                        >
                          <Stack gap="lg">
                            <CheckoutStatusStepper
                              phase={phase}
                              polling={polling}
                              pollError={pollError}
                            />
                            <Divider className="checkout-result-divider" />
                            {isPaid ? (
                              <CheckoutSuccessContent
                                eventHref={eventPath(event)}
                                isFree={isFreeOrder}
                              />
                            ) : (
                              <CheckoutErrorContent
                                eventHref={eventPath(event)}
                                onRetry={handleCheckoutRetry}
                              />
                            )}
                          </Stack>
                        </PremiumPaper>
                      ) : (
                        <>
                          <PremiumPaper p="xl">
                            <CheckoutStatusStepper
                              phase={phase}
                              polling={polling}
                              pollError={pollError}
                            />
                          </PremiumPaper>

                          {(showPaymentForm || showPaymentProgress || isPendingPersistence) ? (
                            <Box
                              className={`checkout-payment-slot${showPaymentForm ? " checkout-payment-slot--with-form" : ""}`}
                            >
                              {showPaymentProgress ? (
                                <CheckoutPaymentProgressPanel {...paymentProgressCopy} />
                              ) : isPendingPersistence ? (
                                <CheckoutPaymentProgressPanel
                                  title="Preparando seu pedido"
                                  description="Estamos confirmando sua reserva. Em seguida você poderá escolher a forma de pagamento."
                                />
                              ) : null}

                              {showPaymentForm ? (
                                <Stack gap="lg">
                                  <PremiumPaper p="xl">
                                    <Stack gap="lg">
                                      <Group gap="sm" className="producer-form-section-title">
                                        <ThemeIcon
                                          size={40}
                                          radius="md"
                                          variant="light"
                                          color="brand"
                                        >
                                          <IconCreditCard size={20} />
                                        </ThemeIcon>
                                        <Stack gap={2}>
                                          <Title order={3} size="h4" className="producer-section-title">
                                            Forma de pagamento
                                          </Title>
                                          <Text size="sm" c="dimmed">
                                            Escolha como deseja pagar seu pedido.
                                          </Text>
                                        </Stack>
                                      </Group>

                                      <SegmentedControl
                                        fullWidth
                                        radius="xl"
                                        value={paymentMethod}
                                        onChange={handlePaymentMethodChange}
                                        data={[
                                          {
                                            value: "pix",
                                            label: (
                                              <Group gap={8} justify="center" wrap="nowrap">
                                                <IconQrcode size={18} />
                                                <span>PIX</span>
                                              </Group>
                                            ),
                                          },
                                          {
                                            value: "card",
                                            label: (
                                              <Group gap={8} justify="center" wrap="nowrap">
                                                <IconCreditCard size={18} />
                                                <span>Cartão de crédito</span>
                                              </Group>
                                            ),
                                          },
                                        ]}
                                      />
                                    </Stack>
                                  </PremiumPaper>

                                  {paymentMethod === "pix" && isPixReady && status?.payment ? (
                                    <PixPaymentPanel
                                      pixCopyPaste={status.payment.pixCopyPaste}
                                      amountCents={status.payment.amountCents}
                                      expiresAt={status.payment.expiresAt}
                                    />
                                  ) : null}

                                  {paymentMethod === "pix" && isPaymentPending ? (
                                    pixGenerating ? (
                                      <PixPaymentSkeleton />
                                    ) : pixGenerateError ? (
                                      <Alert
                                        color="red"
                                        variant="light"
                                        radius="lg"
                                        icon={<IconAlertCircle size={18} />}
                                        title="Não foi possível gerar o PIX"
                                      >
                                        <Stack gap="sm">
                                          <Text size="sm">{pixGenerateError}</Text>
                                          {status?.order?.id ? (
                                            <Button
                                              radius="xl"
                                              variant="light"
                                              onClick={() => void generatePix(status.order!.id)}
                                            >
                                              Tentar novamente
                                            </Button>
                                          ) : null}
                                        </Stack>
                                      </Alert>
                                    ) : null
                                  ) : null}

                                  {paymentMethod === "card" && status?.order ? (
                                    <CardPaymentPanel
                                      amountCents={orderAmountCents}
                                      defaultEmail={user?.email}
                                      submitting={cardSubmitting}
                                      onSubmit={(payload) => void handleCardPayment(payload)}
                                    />
                                  ) : null}
                                </Stack>
                              ) : null}
                            </Box>
                          ) : null}

                          {isPixReady && paymentMethod === "pix" && import.meta.env.DEV ? (
                            <DevSimulatePaymentPanel
                              loading={simulating}
                              onSimulate={() => void handleSimulatePayment()}
                            />
                          ) : null}

                          <Group>
                            <Button
                              variant="subtle"
                              component={Link}
                              to={eventPath(event)}
                              radius="xl"
                            >
                              Voltar ao evento
                            </Button>
                          </Group>
                        </>
                      )}
                    </Stack>
                  </AnimatedSection>
                )}
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 5 }}>
              <AnimatedSection delayMs={80} animate={false}>
                <Box className="checkout-summary-sticky">
                  <CheckoutOrderSummary
                    event={event}
                    selectedLot={selectedLot}
                    quantity={quantity}
                    subtotalCents={pricing.subtotalCents}
                    platformFeeCents={pricing.platformFeeCents}
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

    <Modal
      opened={pendingOrderModalOpen}
      onClose={() => setPendingOrderModalOpen(false)}
      title="Você já tem um pedido pendente"
      centered
      radius="md"
    >
      <Stack gap="lg">
        <Text size="sm" c="dimmed">
          Para reservar novos ingressos, pague o pedido em aberto ou aguarde a expiração do prazo
          de pagamento. Assim evitamos reservas duplicadas e liberamos estoque com mais justiça.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" radius="xl" onClick={() => setPendingOrderModalOpen(false)}>
            Fechar
          </Button>
          <Button
            radius="xl"
            leftSection={<IconReceipt size={18} />}
            onClick={() => {
              setPendingOrderModalOpen(false);
              navigate("/pedidos");
            }}
          >
            Ir para meus pedidos
          </Button>
        </Group>
      </Stack>
    </Modal>
    </>
  );
}
