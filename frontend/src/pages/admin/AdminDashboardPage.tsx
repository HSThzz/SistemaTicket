/**
 * @file Painel administrativo: gestão de papéis e reembolsos.
 * @module pages/admin/AdminDashboardPage
 */

import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconReceiptRefund,
  IconSearch,
  IconShield,
  IconUserCog,
} from "@tabler/icons-react";
import { AnimatedSection } from "../../components/home/AnimatedSection";
import { PageHeader } from "../../components/account/PageHeader";
import { PremiumPaper } from "../../components/account/PremiumPaper";
import * as authService from "../../features/identity/api/authService";
import * as orderService from "../../features/sales/api/orderService";
import type { AuthUser, OrderAdminDetails, UserRole } from "../../types/api";
import { formatCurrencyFromCents } from "../../utils/format";
import { getApiErrorMessage } from "../../utils/errors";
import { getOrderStatusLabel } from "../../utils/statusLabels";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "CLIENT", label: "Cliente" },
  { value: "PRODUCER", label: "Produtor" },
  { value: "ADMIN", label: "Administrador" },
];

/**
 * Dashboard admin com busca de usuário (alterar papel) e reembolso de pedidos.
 */
export function AdminDashboardPage() {
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const [roleSaving, setRoleSaving] = useState(false);

  const [orderId, setOrderId] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderAdminDetails | null>(null);
  const [refundLoading, setRefundLoading] = useState(false);

  const userForm = useForm({
    initialValues: { email: "" },
    validate: {
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value.trim()) ? null : "E-mail inválido",
    },
  });

  const handleLookupUser = userForm.onSubmit(async (values) => {
    setLookupLoading(true);
    setLookupError(null);
    setSelectedUser(null);

    try {
      const user = await authService.lookupUserByEmail(values.email.trim());
      setSelectedUser(user);
    } catch (err) {
      setLookupError(getApiErrorMessage(err, "Usuário não encontrado."));
    } finally {
      setLookupLoading(false);
    }
  });

  const handleSaveRole = async (role: UserRole) => {
    if (!selectedUser) return;

    setRoleSaving(true);
    try {
      const updated = await authService.updateUserRole(selectedUser.id, role);
      setSelectedUser(updated);
      notifications.show({
        title: "Papel atualizado",
        message: `${updated.email} agora é ${role}.`,
        color: "green",
      });
    } catch (err) {
      notifications.show({
        title: "Erro",
        message: getApiErrorMessage(err, "Não foi possível alterar o papel."),
        color: "red",
      });
    } finally {
      setRoleSaving(false);
    }
  };

  const handleLookupOrder = async () => {
    const id = orderId.trim();
    if (!id) {
      setOrderError("Informe o ID do pedido.");
      return;
    }

    setOrderLoading(true);
    setOrderError(null);
    setOrderDetails(null);

    try {
      const order = await orderService.getOrderByIdAdmin(id);
      setOrderDetails(order);
    } catch (err) {
      setOrderError(getApiErrorMessage(err, "Pedido não encontrado."));
    } finally {
      setOrderLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!orderDetails) return;

    setRefundLoading(true);
    try {
      const result = await orderService.refundOrder(orderDetails.id);
      notifications.show({
        title: "Reembolso processado",
        message: `${result.ticketsCancelled} ingresso(s) cancelado(s); estoque +${result.stockRestored}.`,
        color: "green",
      });
      const refreshed = await orderService.getOrderByIdAdmin(orderDetails.id);
      setOrderDetails(refreshed);
    } catch (err) {
      notifications.show({
        title: "Reembolso falhou",
        message: getApiErrorMessage(err, "Não foi possível reembolsar o pedido."),
        color: "red",
      });
    } finally {
      setRefundLoading(false);
    }
  };

  return (
    <Stack gap="xl">
      <AnimatedSection>
        <PageHeader
          title="Administração"
          description="Gerencie papéis de usuário e reembolsos de pedidos pagos."
        />
      </AnimatedSection>

      <AnimatedSection delayMs={40}>
        <PremiumPaper p="xl">
          <Group gap="sm" mb="md">
            <IconUserCog size={22} />
            <Title order={3}>Usuários</Title>
          </Group>

          <form onSubmit={handleLookupUser}>
            <Group align="flex-end" wrap="wrap">
              <TextInput
                label="E-mail do usuário"
                placeholder="cliente@exemplo.com"
                style={{ flex: 1, minWidth: 240 }}
                {...userForm.getInputProps("email")}
              />
              <Button
                type="submit"
                loading={lookupLoading}
                leftSection={<IconSearch size={16} />}
              >
                Buscar
              </Button>
            </Group>
          </form>

          {lookupError ? (
            <Alert
              mt="md"
              color="red"
              icon={<IconAlertCircle size={16} />}
              title="Busca"
            >
              {lookupError}
            </Alert>
          ) : null}

          {selectedUser ? (
            <Stack mt="lg" gap="sm">
              <Group justify="space-between" wrap="wrap">
                <div>
                  <Text fw={600}>{selectedUser.name}</Text>
                  <Text size="sm" c="dimmed">
                    {selectedUser.email}
                  </Text>
                  <Text size="xs" c="dimmed">
                    ID: {selectedUser.id}
                  </Text>
                </div>
                <Badge size="lg" variant="light">
                  {selectedUser.role}
                </Badge>
              </Group>

              <Select
                label="Alterar papel"
                data={ROLE_OPTIONS}
                value={selectedUser.role}
                onChange={(value) => {
                  if (value) {
                    void handleSaveRole(value as UserRole);
                  }
                }}
                disabled={roleSaving}
              />
            </Stack>
          ) : null}
        </PremiumPaper>
      </AnimatedSection>

      <AnimatedSection delayMs={80}>
        <PremiumPaper p="xl">
          <Group gap="sm" mb="md">
            <IconReceiptRefund size={22} />
            <Title order={3}>Reembolsos</Title>
          </Group>

          <Group align="flex-end" wrap="wrap">
            <TextInput
              label="ID do pedido"
              placeholder="UUID do pedido"
              value={orderId}
              onChange={(event) => setOrderId(event.currentTarget.value)}
              style={{ flex: 1, minWidth: 280 }}
            />
            <Button loading={orderLoading} onClick={() => void handleLookupOrder()}>
              Consultar
            </Button>
          </Group>

          {orderError ? (
            <Alert
              mt="md"
              color="red"
              icon={<IconAlertCircle size={16} />}
              title="Pedido"
            >
              {orderError}
            </Alert>
          ) : null}

          {orderDetails ? (
            <Stack mt="lg" gap="sm">
              <Group justify="space-between" wrap="wrap">
                <div>
                  <Text fw={600}>{orderDetails.eventTitle ?? "Evento"}</Text>
                  <Text size="sm" c="dimmed">
                    {orderDetails.userName} · {orderDetails.userEmail}
                  </Text>
                </div>
                <Badge size="lg" color={orderDetails.status === "PAID" ? "green" : "gray"}>
                  {getOrderStatusLabel(orderDetails.status)}
                </Badge>
              </Group>

              <Text size="sm">
                Valor:{" "}
                <Text span fw={600}>
                  {formatCurrencyFromCents(orderDetails.totalPrice)}
                </Text>
              </Text>

              <Button
                color="red"
                variant="light"
                leftSection={<IconShield size={16} />}
                loading={refundLoading}
                disabled={orderDetails.status !== "PAID"}
                onClick={() => void handleRefund()}
              >
                Reembolsar pedido
              </Button>

              {orderDetails.status !== "PAID" ? (
                <Text size="xs" c="dimmed">
                  Apenas pedidos com status PAID podem ser reembolsados.
                </Text>
              ) : null}
            </Stack>
          ) : null}
        </PremiumPaper>
      </AnimatedSection>
    </Stack>
  );
}
