import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  NumberInput,
  Paper,
  Stack,
  Stepper,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconShoppingCart,
  IconX,
} from "@tabler/icons-react";
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
    return (
      <Center py="xl">
        <Loader color="brand" size="lg" />
      </Center>
    );
  }

  if (eventError || !event || !selectedLot) {
    return (
      <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro">
        {eventError ?? "Lote não encontrado."}
      </Alert>
    );
  }

  const phase = status?.phase;
  const isCheckoutStarted = Boolean(reservationId);
  const isPaid = phase === "PAID";
  const isFailed = phase === "EXPIRED" || phase === "FAILED";

  return (
    <Stack gap="xl">
      <Stack gap={4}>
        <Title order={2}>Checkout</Title>
        <Text c="dimmed">
          {event.title} · {selectedLot.name}
        </Text>
      </Stack>

      {isCheckoutStarted ? (
        <Paper p="lg" radius="md" withBorder>
          <Stack gap="lg">
            <Group justify="space-between">
              <Text fw={600}>Status da compra</Text>
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
              <Alert color="red" icon={<IconAlertCircle size={18} />}>
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
                  loading={simulating}
                  onClick={() => void handleSimulatePayment()}
                >
                  Simular pagamento PIX (dev)
                </Button>
              </>
            ) : null}

            {isPaid ? (
              <Alert color="green" icon={<IconCheck size={18} />} title="Pagamento confirmado!">
                Seus ingressos foram emitidos com sucesso.
              </Alert>
            ) : null}

            {isFailed ? (
              <Alert color="red" icon={<IconAlertCircle size={18} />} title="Compra não concluída">
                A reserva expirou ou o pagamento falhou. Tente novamente.
              </Alert>
            ) : null}

            <Group>
              {isPaid ? (
                <Button component={Link} to="/ingressos">
                  Ver meus ingressos
                </Button>
              ) : null}
              {isFailed ? (
                <Button
                  onClick={() => {
                    setReservationId(null);
                    setConfirmingPayment(false);
                  }}
                >
                  Tentar novamente
                </Button>
              ) : null}
              <Button variant="subtle" component={Link} to={`/eventos/${event.id}`}>
                Voltar ao evento
              </Button>
            </Group>
          </Stack>
        </Paper>
      ) : (
        <Paper p="lg" radius="md" withBorder>
          <Stack gap="lg">
            <Stack gap="xs">
              <Text fw={600}>Resumo</Text>
              <Group justify="space-between">
                <Text c="dimmed">Lote</Text>
                <Text>{selectedLot.name}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">Preço unitário</Text>
                <Text>{formatCurrencyFromCents(selectedLot.price)}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">Disponíveis</Text>
                <Text>{selectedLot.availableQuantity}</Text>
              </Group>
            </Stack>

            <NumberInput
              label="Quantidade"
              min={1}
              max={selectedLot.availableQuantity}
              value={quantity}
              onChange={(value) => setQuantity(Number(value) || 1)}
            />

            <Group justify="space-between">
              <Text fw={700} size="lg">
                Total
              </Text>
              <Text fw={700} size="lg" c="brand">
                {formatCurrencyFromCents(totalCents)}
              </Text>
            </Group>

            <Button
              leftSection={<IconShoppingCart size={18} />}
              loading={reserving}
              disabled={selectedLot.availableQuantity === 0}
              onClick={() => void handleReserve()}
            >
              Reservar ingressos
            </Button>

            <Text size="sm" c="dimmed">
              Após reservar, você terá <strong>15 minutos</strong> para pagar via PIX.
            </Text>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
