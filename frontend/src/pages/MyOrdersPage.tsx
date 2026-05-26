import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Center,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import * as orderService from "../services/orderService";
import type { OrderListItem } from "../types/api";
import { formatCurrencyFromCents } from "../utils/format";
import { getApiErrorMessage } from "../utils/errors";
import { getOrderStatusColor, getOrderStatusLabel } from "../utils/statusLabels";

export function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    orderService
      .listMyOrders()
      .then((data) => {
        if (!cancelled) {
          setOrders(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Não foi possível carregar seus pedidos."));
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
  }, []);

  if (loading) {
    return (
      <Center py="xl">
        <Loader color="brand" size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="xl">
      <Stack gap={4}>
        <Title order={1}>Meus pedidos</Title>
        <Text c="dimmed">Histórico de compras e status de pagamento.</Text>
      </Stack>

      {error ? (
        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro">
          {error}
        </Alert>
      ) : null}

      {!error && orders.length === 0 ? (
        <Alert icon={<IconAlertCircle size={18} />} color="gray" title="Nenhum pedido">
          Você ainda não realizou nenhuma compra.
        </Alert>
      ) : null}

      {orders.length > 0 ? (
        <Paper radius="md" withBorder>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Pedido</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Total</Table.Th>
                <Table.Th>Reserva</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {orders.map((order) => (
                <Table.Tr key={order.id}>
                  <Table.Td>
                    <Stack gap={2}>
                      <Text size="sm" fw={500}>
                        #{order.id.slice(0, 8)}
                      </Text>
                      {order.paymentGatewayId ? (
                        <Text size="xs" c="dimmed">
                          {order.paymentGatewayId.slice(0, 20)}...
                        </Text>
                      ) : null}
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getOrderStatusColor(order.status)} variant="light">
                      {getOrderStatusLabel(order.status)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{formatCurrencyFromCents(order.totalPrice)}</Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed" ff="monospace">
                      {order.reservationId.slice(0, 8)}...
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      ) : null}
    </Stack>
  );
}
