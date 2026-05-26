import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { Anchor, Badge, Box, Group, Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconReceipt, IconTicket } from "@tabler/icons-react";
import type { OrderListItem } from "../types/api";
import { formatCurrencyFromCents } from "../utils/format";
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
            </Stack>
            <Badge color={getOrderStatusColor(order.status)} variant="light" radius="sm">
              {getOrderStatusLabel(order.status)}
            </Badge>
          </Group>

          <Stack gap={4}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Total pago
            </Text>
            <Text className="order-total-value" c={isPaid ? "green" : undefined}>
              {formatCurrencyFromCents(order.totalPrice)}
            </Text>
          </Stack>

          <Stack gap="sm">
            {order.paymentGatewayId ? (
              <Box className="order-meta-block">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={6}>
                  ID do pagamento
                </Text>
                <Text ff="monospace" size="sm" fw={500} style={{ wordBreak: "break-all" }}>
                  {order.paymentGatewayId}
                </Text>
              </Box>
            ) : null}

            <Box className="order-meta-block">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={6}>
                Reserva
              </Text>
              <Text ff="monospace" size="sm" fw={500} style={{ wordBreak: "break-all" }}>
                {order.reservationId}
              </Text>
            </Box>
          </Stack>

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
          ) : (
            <Text size="sm" c="dimmed">
              {order.status === "PENDING"
                ? "Aguardando confirmação do pagamento PIX."
                : "Este pedido não gerou ingressos ativos."}
            </Text>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}
