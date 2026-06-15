/**
 * @file Painel administrativo: suporte (busca/reembolso) e plataforma (papéis, estoque, auditoria).
 * @module pages/admin/AdminDashboardPage
 */

import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconDatabase,
  IconHistory,
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
import * as purchaseService from "../../features/sales/api/purchaseService";
import { useAuth } from "../../context/AuthContext";
import type {
  AdminAuditLogEntry,
  AuthUser,
  OrderAdminDetails,
  StockReconciliationReport,
  UserRole,
} from "../../types/api";
import { formatCurrencyFromCents } from "../../utils/format";
import { getApiErrorMessage } from "../../utils/errors";
import { getOrderStatusLabel } from "../../utils/statusLabels";
import {
  ASSIGNABLE_ROLE_OPTIONS,
  AUDIT_ACTION_LABELS,
  isSuperAdmin,
  ROLE_LABELS,
} from "../../utils/adminRoles";

/**
 * Dashboard admin com abas de suporte e plataforma (super admin).
 */
export function AdminDashboardPage() {
  const { user: currentUser } = useAuth();
  const canManagePlatform = isSuperAdmin(currentUser?.role);

  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const [roleSaving, setRoleSaving] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [roleConfirmOpened, { open: openRoleConfirm, close: closeRoleConfirm }] =
    useDisclosure(false);

  const [orderId, setOrderId] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderAdminDetails | null>(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundConfirmOpened, { open: openRefundConfirm, close: closeRefundConfirm }] =
    useDisclosure(false);

  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [reconcileReport, setReconcileReport] =
    useState<StockReconciliationReport | null>(null);

  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogEntry[]>([]);

  const userForm = useForm({
    initialValues: { email: "" },
    validate: {
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value.trim()) ? null : "E-mail inválido",
    },
  });

  const loadAuditLogs = async () => {
    if (!canManagePlatform) return;

    setAuditLoading(true);
    setAuditError(null);

    try {
      const logs = await authService.listAdminAuditLogs(50);
      setAuditLogs(logs);
    } catch (err) {
      setAuditError(getApiErrorMessage(err, "Não foi possível carregar a auditoria."));
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (canManagePlatform) {
      void loadAuditLogs();
    }
  }, [canManagePlatform]);

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

  const handleRoleSelect = (role: UserRole | null) => {
    if (!selectedUser || !role || role === selectedUser.role) return;
    setPendingRole(role);
    openRoleConfirm();
  };

  const handleConfirmRoleChange = async () => {
    if (!selectedUser || !pendingRole) return;

    setRoleSaving(true);
    try {
      const updated = await authService.updateUserRole(selectedUser.id, pendingRole);
      setSelectedUser(updated);
      notifications.show({
        title: "Papel atualizado",
        message: `${updated.email} agora é ${ROLE_LABELS[pendingRole]}.`,
        color: "green",
      });
      closeRoleConfirm();
      setPendingRole(null);
      void loadAuditLogs();
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
      closeRefundConfirm();
      if (canManagePlatform) {
        void loadAuditLogs();
      }
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

  const handleReconcileStock = async () => {
    setReconcileLoading(true);
    try {
      const report = await purchaseService.reconcileStock();
      setReconcileReport(report);
      notifications.show({
        title: "Reconciliação concluída",
        message: `${report.correctedCount} lote(s) corrigido(s) de ${report.lotsChecked} verificados.`,
        color: report.correctedCount > 0 ? "yellow" : "green",
      });
      void loadAuditLogs();
    } catch (err) {
      notifications.show({
        title: "Reconciliação falhou",
        message: getApiErrorMessage(err, "Não foi possível reconciliar o estoque."),
        color: "red",
      });
    } finally {
      setReconcileLoading(false);
    }
  };

  const supportPanel = (
    <Stack gap="xl">
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
                {ROLE_LABELS[selectedUser.role]}
              </Badge>
            </Group>

            {canManagePlatform ? (
              <Select
                label="Alterar papel"
                description="Apenas super administradores podem promover ou rebaixar papéis."
                data={ASSIGNABLE_ROLE_OPTIONS}
                value={selectedUser.role}
                allowDeselect={false}
                comboboxProps={{ withinPortal: true }}
                onChange={(value) => {
                  if (value) {
                    handleRoleSelect(value as UserRole);
                  }
                }}
                disabled={roleSaving}
              />
            ) : (
              <Alert color="blue" variant="light" title="Somente consulta">
                Administradores de suporte podem buscar usuários, mas não alterar papéis.
              </Alert>
            )}
          </Stack>
        ) : null}
      </PremiumPaper>

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
              onClick={openRefundConfirm}
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
    </Stack>
  );

  const platformPanel = (
    <Stack gap="xl">
      <PremiumPaper p="xl">
        <Group gap="sm" mb="md">
          <IconDatabase size={22} />
          <Title order={3}>Reconciliar estoque</Title>
        </Group>

        <Text size="sm" c="dimmed" mb="md">
          Alinha o estoque no Redis com o PostgreSQL, descontando reservas pendentes nas filas.
        </Text>

        <Button
          loading={reconcileLoading}
          onClick={() => void handleReconcileStock()}
        >
          Executar reconciliação
        </Button>

        {reconcileReport ? (
          <Stack mt="md" gap="xs">
            <Text size="sm">
              Verificados: <Text span fw={600}>{reconcileReport.lotsChecked}</Text>
              {" · "}
              Corrigidos: <Text span fw={600}>{reconcileReport.correctedCount}</Text>
            </Text>
            <Text size="xs" c="dimmed">
              Última execução: {new Date(reconcileReport.checkedAt).toLocaleString("pt-BR")}
            </Text>
          </Stack>
        ) : null}
      </PremiumPaper>

      <PremiumPaper p="xl">
        <Group justify="space-between" mb="md" wrap="wrap">
          <Group gap="sm">
            <IconHistory size={22} />
            <Title order={3}>Auditoria</Title>
          </Group>
          <Button
            variant="light"
            size="xs"
            loading={auditLoading}
            onClick={() => void loadAuditLogs()}
          >
            Atualizar
          </Button>
        </Group>

        {auditError ? (
          <Alert color="red" icon={<IconAlertCircle size={16} />} title="Auditoria">
            {auditError}
          </Alert>
        ) : null}

        {auditLogs.length === 0 && !auditLoading ? (
          <Text size="sm" c="dimmed">
            Nenhuma ação registrada ainda.
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={520}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Quando</Table.Th>
                  <Table.Th>Ação</Table.Th>
                  <Table.Th>Ator</Table.Th>
                  <Table.Th>Alvo</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {auditLogs.map((log) => (
                  <Table.Tr key={log.id}>
                    <Table.Td>
                      <Text size="xs">
                        {new Date(log.createdAt).toLocaleString("pt-BR")}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {AUDIT_ACTION_LABELS[log.action] ?? log.action}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">
                        {log.actorEmail ?? log.actorUserId}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {log.targetType}/{log.targetId.slice(0, 8)}…
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </PremiumPaper>
    </Stack>
  );

  return (
    <Stack gap="xl">
      <AnimatedSection>
        <PageHeader
          title="Administração"
          description={
            canManagePlatform
              ? "Suporte a usuários e pedidos; gestão de papéis, estoque e auditoria."
              : "Suporte a usuários e reembolsos de pedidos pagos."
          }
        />
      </AnimatedSection>

      <AnimatedSection delayMs={40}>
        {canManagePlatform ? (
          <Tabs defaultValue="support">
            <Tabs.List mb="lg">
              <Tabs.Tab value="support" leftSection={<IconShield size={16} />}>
                Suporte
              </Tabs.Tab>
              <Tabs.Tab value="platform" leftSection={<IconDatabase size={16} />}>
                Plataforma
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="support">{supportPanel}</Tabs.Panel>
            <Tabs.Panel value="platform">{platformPanel}</Tabs.Panel>
          </Tabs>
        ) : (
          supportPanel
        )}
      </AnimatedSection>

      <Modal
        opened={refundConfirmOpened}
        onClose={closeRefundConfirm}
        title="Confirmar reembolso"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Reembolsar o pedido de{" "}
            <Text span fw={600}>
              {orderDetails?.userName}
            </Text>{" "}
            no valor de{" "}
            <Text span fw={600}>
              {orderDetails ? formatCurrencyFromCents(orderDetails.totalPrice) : "—"}
            </Text>
            ? Esta ação cancela os ingressos e restaura o estoque.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeRefundConfirm}>
              Cancelar
            </Button>
            <Button
              color="red"
              loading={refundLoading}
              onClick={() => void handleRefund()}
            >
              Confirmar reembolso
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={roleConfirmOpened}
        onClose={closeRoleConfirm}
        title="Confirmar alteração de papel"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Alterar o papel de{" "}
            <Text span fw={600}>
              {selectedUser?.email}
            </Text>{" "}
            de{" "}
            <Text span fw={600}>
              {selectedUser ? ROLE_LABELS[selectedUser.role] : "—"}
            </Text>{" "}
            para{" "}
            <Text span fw={600}>
              {pendingRole ? ROLE_LABELS[pendingRole] : "—"}
            </Text>
            ?
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeRoleConfirm}>
              Cancelar
            </Button>
            <Button loading={roleSaving} onClick={() => void handleConfirmRoleChange()}>
              Confirmar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
