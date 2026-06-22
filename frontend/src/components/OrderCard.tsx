/**
 * @file Card premium de pedido com direcionamento ao checkout quando pendente.
 * @module components/OrderCard
 */

import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import {
  Alert,
  Anchor,
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconClock, IconReceipt, IconTicket } from "@tabler/icons-react";
import { OrderStatusBadge } from "./ui/OrderStatusBadge";
import type { OrderListItem } from "../types/api";
import { formatCurrencyFromCents } from "../utils/format";

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
 * Exibe resumo do pedido e link para checkout ou ingressos conforme o status.
 */
export function OrderCard({ order }: OrderCardProps) {
  const isPaid = order.status === "PAID";
  const isPending = order.status === "PENDING";
  const checkoutUrl = order.eventId
    ? `/eventos/${order.eventId}/comprar?reservation=${order.reservationId}`
    : null;

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
            <OrderStatusBadge status={order.status} />
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
            <Stack gap="sm" className="order-card-pending-section">
              <Alert
                color="orange"
                variant="light"
                radius="lg"
                icon={<IconClock size={18} />}
                title="Aguardando pagamento"
              >
                <Text size="sm" style={{ lineHeight: 1.55 }}>
                  Escolha PIX ou cartão no checkout para concluir esta compra.
                </Text>
              </Alert>

              {checkoutUrl ? (
                <Button
                  component={Link}
                  to={checkoutUrl}
                  variant="filled"
                  color="brand"
                  radius="xl"
                  fullWidth
                >
                  Continuar no checkout
                </Button>
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
