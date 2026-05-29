import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import {
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Collapse,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown, IconChevronUp, IconReceipt, IconTicket } from "@tabler/icons-react";
import { PixPaymentPanel } from "./PixPaymentPanel";
import * as orderService from "../services/orderService";
import type { OrderListItem, PixPaymentDetails } from "../types/api";
import { formatCurrencyFromCents } from "../utils/format";
import { getApiErrorMessage } from "../utils/errors";
import { getOrderStatusColor, getOrderStatusLabel } from "../utils/statusLabels";

interface OrderCardProps {
  order: OrderListItem;
}

function getOrderAccentStyle(status: string): CSSProperties {
  switch (status) {
    case "PAID":
      return { background: "linear-gradient(160deg, #22c55e 0%, #14b8a6 100%)" };
    case "PENDING":
      return { background: "linear-gradient(160deg, #f59e0b 0%, #f97316 100%)" };
    case "FAILED":
      return { background: "linear-gradient(160deg, #ef4444 0%, #dc2626 100%)" };
    case "REFUNDED":
      return { background: "linear-gradient(160deg, #94a3b8 0%, #64748b 100%)" };
    default:
      return { background: "linear-gradient(160deg, #6366f1 0%, #4a6fe8 100%)" };
  }
}

function getOrderStubLabel(status: string): string {
  switch (status) {
    case "PAID":
      return "Pago";
    case "PENDING":
      return "Pend.";
    case "FAILED":
      return "Falhou";
    case "REFUNDED":
      return "Estorn.";
    default:
      return "Pedido";
  }
}

export function OrderCard({ order }: OrderCardProps) {
  const isPaid = order.status === "PAID";
  const isPending = order.status === "PENDING";
  const [pixOpen, { toggle: togglePix }] = useDisclosure(Boolean(order.payment));
  const [payment, setPayment] = useState<PixPaymentDetails | null>(order.payment);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    setPayment(order.payment);
  }, [order.payment]);

  const loadPayment = async () => {
    if (payment || loadingPayment) {
      return;
    }

    setLoadingPayment(true);
    setPaymentError(null);

    try {
      const details = await orderService.getOrderPayment(order.id);
      setPayment(details);
    } catch (error) {
      setPaymentError(getApiErrorMessage(error, "Não foi possível carregar o PIX."));
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleTogglePix = () => {
    if (!pixOpen && !payment) {
      void loadPayment();
    }
    togglePix();
  };

  return (
    <Paper radius="lg" className="order-card-premium" component="article">
      <Group wrap="nowrap" align="stretch" gap={0}>
        <Box className="order-card-stub" style={getOrderAccentStyle(order.status)}>
          <ThemeIcon size={36} radius="md" variant="white" color="dark" style={{ opacity: 0.92 }}>
            <IconReceipt size={20} stroke={1.6} />
          </ThemeIcon>
          <Text size="xs" c="white" fw={700} ta="center" style={{ opacity: 0.95, lineHeight: 1.2 }}>
            {getOrderStubLabel(order.status)}
          </Text>
        </Box>

        <Stack gap="lg" className="order-card-body">
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
            <Stack gap={6} flex={1} miw={0}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Pedido
              </Text>
              <Title order={4} style={{ letterSpacing: "-0.01em" }}>
                #{order.id.slice(0, 8).toUpperCase()}
              </Title>
              {order.eventTitle ? (
                <Text size="sm" c="dimmed" lineClamp={2}>
                  {order.eventTitle}
                </Text>
              ) : null}
            </Stack>
            <Badge color={getOrderStatusColor(order.status)} variant="light" radius="sm">
              {getOrderStatusLabel(order.status)}
            </Badge>
          </Group>

          <Stack gap={4}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              {isPaid ? "Total pago" : "Total"}
            </Text>
            <Text className="order-total-value" c={isPaid ? "green" : undefined}>
              {formatCurrencyFromCents(order.totalPrice)}
            </Text>
          </Stack>

          {isPending ? (
            <Stack gap="sm">
              <Button
                variant="light"
                color="teal"
                radius="xl"
                onClick={handleTogglePix}
                rightSection={pixOpen ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
              >
                {pixOpen ? "Ocultar PIX" : "Ver PIX para pagar"}
              </Button>

              {order.eventId ? (
                <Button
                  component={Link}
                  to={`/eventos/${order.eventId}/comprar?reservation=${order.reservationId}`}
                  variant="subtle"
                  radius="xl"
                  size="sm"
                >
                  Abrir checkout do evento
                </Button>
              ) : null}

              <Collapse expanded={pixOpen}>
                {loadingPayment ? (
                  <Group justify="center" py="md">
                    <Loader size="sm" color="brand" />
                  </Group>
                ) : null}

                {paymentError ? (
                  <Alert color="red" radius="lg">
                    {paymentError}
                  </Alert>
                ) : null}

                {payment ? (
                  <PixPaymentPanel
                    pixCopyPaste={payment.pixCopyPaste}
                    amountCents={payment.amountCents}
                    expiresAt={payment.expiresAt}
                    compact
                  />
                ) : null}
              </Collapse>
            </Stack>
          ) : null}

          {isPaid ? (
            <Anchor
              component={Link}
              to="/ingressos"
              size="sm"
              fw={600}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <IconTicket size={16} />
              Ver meus ingressos →
            </Anchor>
          ) : !isPending ? (
            <Text size="sm" c="dimmed">
              Este pedido não gerou ingressos ativos.
            </Text>
          ) : null}
        </Stack>
      </Group>
    </Paper>
  );
}
