import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
  Group,
  Loader,
  NumberInput,
  Stack,
  Stepper,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconShoppingCart,
  IconTicket,
  IconX,
} from "@tabler/icons-react";
import { AnimatedSection } from "../components/home/AnimatedSection";
import { PageHeader } from "../components/account/PageHeader";
import { PageLoader } from "../components/account/PageLoader";
import { PremiumPaper } from "../components/account/PremiumPaper";
import { PixPaymentPanel } from "../components/PixPaymentPanel";
import { PhaseBadge } from "../components/PhaseBadge";
import { useReservationPoller } from "../hooks/useReservationPoller";
import * as eventService from "../services/eventService";
import * as purchaseService from "../services/purchaseService";
import type { Event, TicketLot } from "../types/api";
import { formatCurrencyFromCents } from "../utils/format";
import { getApiErrorMessage } from "../utils/errors";

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

export function CheckoutPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();

  const lotIdFromQuery = searchParams.get("lot") ?? "";

  const [event, setEvent] = useState<Event | null>(null);
  const [selectedLot, setSelectedLot] = useState<TicketLot | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);

  const [reservationId, setReservationId] = useState<string | null>(null);
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

  const totalCents = useMemo(() => {
    if (!selectedLot) {
      return 0;
    }
    return selectedLot.price * quantity;
  }, [selectedLot, quantity]);

  const handleReserve = async () => {
    if (!selectedLot) {
      return;
    }

    setReserving(true);

    try {
      const response = await purchaseService.reserveTickets(selectedLot.id, quantity);
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
      <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro" radius="lg">
        {eventError ?? "Lote não encontrado."}
      </Alert>
    );
  }

  const phase = status?.phase;
  const isCheckoutStarted = Boolean(reservationId);
  const isPaid = phase === "PAID";
  const isFailed = phase === "EXPIRED" || phase === "FAILED";

  return (
    <Stack gap="lg">
      <AnimatedSection>
        <PageHeader
          icon={<IconShoppingCart size={28} color="var(--mantine-color-brand-6)" />}
          title="Finalizar"
          highlight="compra"
          description={`${event.title} · ${selectedLot.name}`}
        />
      </AnimatedSection>

      {isCheckoutStarted ? (
        <AnimatedSection delayMs={80}>
          <PremiumPaper p="xl">
            <Stack gap="lg">
              <Group justify="space-between" wrap="wrap" gap="sm">
                <Text fw={600} size="lg">
                  Status da compra
                </Text>
                {phase ? <PhaseBadge phase={phase} /> : null}
              </Group>

              <Stepper active={getActiveStep(phase)} size="sm" allowNextStepsSelect={false}>
                <Stepper.Step label="Reserva" description="Confirmada" />
                <Stepper.Step label="Processamento" description="Persistência" />
                <Stepper.Step label="PIX" description="Aguardando" />
                <Stepper.Step label="Concluído" description="Ingressos" />
              </Stepper>

              {polling ? (
                <Group gap="sm">
                  <Loader size="sm" color="brand" />
                  <Text size="sm" c="dimmed">
                    Atualizando status...
                  </Text>
                </Group>
              ) : null}

              {pollError ? (
                <Alert color="red" icon={<IconAlertCircle size={18} />} radius="md">
                  {pollError}
                </Alert>
              ) : null}

              {phase === "AWAITING_PAYMENT" && status?.payment ? (
                <>
                  <PixPaymentPanel
                    pixCopyPaste={status.payment.pixCopyPaste}
                    amountCents={status.payment.amountCents}
                    expiresAt={status.payment.expiresAt}
                  />
                  <Button
                    variant="light"
                    color="teal"
                    radius="xl"
                    loading={simulating}
                    onClick={() => void handleSimulatePayment()}
                  >
                    Simular pagamento PIX (dev)
                  </Button>
                </>
              ) : null}

              {isPaid ? (
                <Alert color="green" icon={<IconCheck size={18} />} title="Pagamento confirmado!" radius="md">
                  Seus ingressos foram emitidos com sucesso.
                </Alert>
              ) : null}

              {isFailed ? (
                <Alert color="red" icon={<IconAlertCircle size={18} />} title="Compra não concluída" radius="md">
                  A reserva expirou ou o pagamento falhou. Tente novamente.
                </Alert>
              ) : null}

              <Group wrap="wrap">
                {isPaid ? (
                  <Button component={Link} to="/ingressos" radius="xl" leftSection={<IconTicket size={18} />}>
                    Ver meus ingressos
                  </Button>
                ) : null}
                {isFailed ? (
                  <Button
                    radius="xl"
                    onClick={() => {
                      setReservationId(null);
                      setConfirmingPayment(false);
                    }}
                  >
                    Tentar novamente
                  </Button>
                ) : null}
                <Button variant="subtle" component={Link} to={`/eventos/${event.id}`} radius="xl">
                  Voltar ao evento
                </Button>
              </Group>
            </Stack>
          </PremiumPaper>
        </AnimatedSection>
      ) : (
        <AnimatedSection delayMs={80}>
          <PremiumPaper p="xl">
            <Stack gap="lg">
              <Stack gap="sm">
                <Text fw={600} size="lg">
                  Resumo do pedido
                </Text>
                <Group justify="space-between">
                  <Text c="dimmed">Lote</Text>
                  <Text fw={500}>{selectedLot.name}</Text>
                </Group>
                <Group justify="space-between">
                  <Text c="dimmed">Preço unitário</Text>
                  <Text fw={500}>{formatCurrencyFromCents(selectedLot.price)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text c="dimmed">Disponíveis</Text>
                  <Text fw={500}>{selectedLot.availableQuantity}</Text>
                </Group>
              </Stack>

              <NumberInput
                label="Quantidade"
                min={1}
                max={selectedLot.availableQuantity}
                value={quantity}
                onChange={(value) => setQuantity(Number(value) || 1)}
                radius="md"
              />

              <Group justify="space-between" pt="xs">
                <Text fw={700} size="xl">
                  Total
                </Text>
                <Text fw={800} size="xl" c="brand" className="order-total-value">
                  {formatCurrencyFromCents(totalCents)}
                </Text>
              </Group>

              <Button
                leftSection={<IconShoppingCart size={18} />}
                loading={reserving}
                disabled={selectedLot.availableQuantity === 0}
                onClick={() => void handleReserve()}
                radius="xl"
                size="md"
              >
                Reservar ingressos
              </Button>

              <Text size="sm" c="dimmed">
                Após reservar, você terá <strong>15 minutos</strong> para pagar via PIX.
              </Text>
            </Stack>
          </PremiumPaper>
        </AnimatedSection>
      )}
    </Stack>
  );
}
