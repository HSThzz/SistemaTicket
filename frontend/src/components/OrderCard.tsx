/**
 * @file Card premium de pedido com PIX embutido para status pendente.
 * @module components/OrderCard
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import {
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconReceipt, IconTicket } from "@tabler/icons-react";
import { PixPaymentPanel } from "./PixPaymentPanel";
import * as orderService from "../features/sales/api/orderService";
import type { OrderListItem, PixPaymentDetails } from "../types/api";
import { formatCurrencyFromCents } from "../utils/format";
import { getApiErrorMessage } from "../utils/errors";
import { getOrderStatusColor, getOrderStatusLabel } from "../utils/statusLabels";

/** Propriedades do card de pedido na listagem do cliente. */
interface OrderCardProps {
  /** Pedido com status, total e dados opcionais de evento/PIX. */
  order: OrderListItem;
}

/** Gradiente da faixa lateral conforme status do pedido. */
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
      return { background: "linear-gradient(160deg, #4ADE80 0%, #22C55E 100%)" };
  }
}

/** Texto curto na aba lateral do card de pedido. */
function getOrderStubLabel(status: string): string {
  switch (status) {
    case "PAID":
      return "Pago";
    case "PENDING":
      return "Pendente";
    case "FAILED":
      return "Falhou";
    case "REFUNDED":
      return "Estorn.";
    default:
      return "Pedido";
  }
}

/**
 * Exibe resumo do pedido, carrega PIX automaticamente se pendente e link para ingressos se pago.
 */
export function OrderCard({ order }: OrderCardProps) {
  const isPaid = order.status === "PAID";
  const isPending = order.status === "PENDING";
  const isMobile = useMediaQuery("(max-width: 48em)");
  const [payment, setPayment] = useState<PixPaymentDetails | null>(order.payment);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const fetchAttemptedRef = useRef(false);

  useEffect(() => {
    setPayment(order.payment);
    fetchAttemptedRef.current = false;
    setPaymentError(null);
  }, [order.payment, order.id]);

  const loadPayment = useCallback(async () => {
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
  }, [order.id]);

  useEffect(() => {
    if (!isPending || payment || fetchAttemptedRef.current) {
      return;
    }

    fetchAttemptedRef.current = true;
    void loadPayment();
  }, [isPending, payment, loadPayment]);

  return (
    <Paper
      radius="lg"
      className={`order-card-premium${isPending ? " order-card-premium--pending" : ""}`}
      component="article"
    >
      <Group wrap="nowrap" align="stretch" gap={0} className="order-card-layout">
        <Box className="order-card-stub" style={getOrderAccentStyle(order.status)}>
          <ThemeIcon size={36} radius="md" variant="white" color="dark" style={{ opacity: 0.92 }}>
            <IconReceipt size={20} stroke={1.6} />
          </ThemeIcon>
          <Text size="xs" c="white" fw={700} ta="center" style={{ opacity: 0.95, lineHeight: 1.2 }}>
            {getOrderStubLabel(order.status)}
          </Text>
        </Box>

        <Stack gap="lg" className="order-card-body">
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
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
            <Stack gap="sm" className="order-card-pix-section">
              {order.eventId ? (
                <Button
                  component={Link}
                  to={`/eventos/${order.eventId}/comprar?reservation=${order.reservationId}`}
                  variant="light"
                  color="brand"
                  radius="xl"
                  fullWidth
                >
                  Continuar no checkout
                </Button>
              ) : null}

              {loadingPayment ? (
                <Group justify="center" py="md">
                  <Loader size="sm" color="brand" />
                  <Text size="sm" c="dimmed">
                    Carregando PIX...
                  </Text>
                </Group>
              ) : null}

              {paymentError ? (
                <Alert color="red" radius="lg">
                  {paymentError}
                  <Button
                    variant="light"
                    color="red"
                    size="xs"
                    mt="sm"
                    fullWidth
                    onClick={() => {
                      fetchAttemptedRef.current = true;
                      setPayment(null);
                      void loadPayment();
                    }}
                  >
                    Tentar novamente
                  </Button>
                </Alert>
              ) : null}

              {payment ? (
                <PixPaymentPanel
                  pixCopyPaste={payment.pixCopyPaste}
                  amountCents={payment.amountCents}
                  expiresAt={payment.expiresAt}
                  compact={isMobile ?? true}
                />
              ) : null}
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
